import { randomBytes } from 'node:crypto';

import {
  BadRequestException,
  Injectable,
  Logger,
  type OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Interval } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CommitRecordsCommand } from '../commands/commit-records/commit-records.command.ts';
import { MigrateStateToRecordsCommand } from '../commands/migrate-state/migrate-state-to-records.command.ts';
import type { CommitPmTrackerRecordsDto } from '../dtos/commit-pm-tracker-records.dto.ts';
import type { PmTrackerCommitResultDto } from '../dtos/pm-tracker-commit-result.dto.ts';
import { PmTrackerHookEntity } from '../entities/pm-tracker-hook.entity.ts';
import { PmTrackerService } from '../pm-tracker.service.ts';
import { GetRecordsQuery } from '../queries/get-records/get-records.query.ts';
import { hasCredential } from '../sync-core/credentials.ts';
import { dateInZone, latestWorkdayOn, validZone } from '../sync-core/dates.ts';
import {
  applyJiraSync,
  computeJiraSync,
  type SyncRun,
  type SyncState,
} from '../sync-core/jira-sync.ts';
import {
  applyGithubSync,
  applyGitlabSync,
  computeGithubSync,
  computeGitlabSync,
} from '../sync-core/pr-sync.ts';
import {
  cloudToState,
  type PersistedState,
  recordsToCloud,
  RecordTracker,
} from '../sync-core/records.ts';
import type {
  CommitResponse,
  RecordsResponse,
} from '../sync-core/records-types.ts';
import type { Transport } from '../sync-core/transport.ts';
import type {
  GitHubConfig,
  GitLabConfig,
  JiraConfig,
} from '../sync-core/types.ts';
import { serverTransport } from './server-transport.ts';

export type SyncKind = 'jira' | 'gitlab' | 'github';
export const SYNC_KINDS: SyncKind[] = ['jira', 'gitlab', 'github'];

export interface ISyncRequest {
  // A scheduled or webhook sync (may be incremental) rather than one the user asked for.
  background: boolean;
  // Only these; all configured ones when omitted.
  kinds?: SyncKind[];
  // The browser's timezone, sent with a manual sync; otherwise the one it saved last.
  timezone?: string;
}

export interface ISyncOutcome {
  startedAt: string;
  finishedAt: string;
  // Per kind that ran: the sync's own counts.
  results: Partial<Record<SyncKind, Record<string, unknown>>>;
  errors: Array<{ kind: string; message: string }>;
}

interface IDueUser {
  userId: Uuid;
  kinds: SyncKind[];
}

/*
 * OFF. On 2026-09-24 production health checks timed out twice. The first cause (records
 * loaded through class-transformer) is fixed, but the instance still failed at 16:09 with
 * scheduled syncs running against real Jira data -- whose responses (changelogs, every
 * developer held at once) are far larger than the benchmark's. Until that is measured
 * and bounded, the server runs no syncs and the web app syncs in the browser.
 */
export const isServerSyncEnabled = false;

// Scheduled syncs wait while the heap is this full (the instance caps it at 300 MB).
const HEAP_CEILING_BYTES = 200 * 1024 * 1024;

const TICK_MS = 60_000;
// A tick stops starting new users after this long; the next tick carries on.
const TICK_BUDGET_MS = 45_000;
// A webhook burst (one per changed issue) collapses into one sync this long after the last.
const HOOK_DEBOUNCE_MS = 20_000;
// After a failed scheduled sync, wait before retrying, doubling up to the cap.
const RETRY_BASE_MS = 5 * 60_000;
const RETRY_MAX_MS = 2 * 60 * 60_000;
// Commit rounds before giving up on a save that keeps conflicting.
const MAX_SAVE_ROUNDS = 20;

type SyncableState = SyncState & PersistedState;
type AnyConnection = JiraConfig | GitLabConfig | GitHubConfig;

// A connection is due when enabled, usable, on an interval, and that long since it synced.
function isDue(kind: SyncKind, c: AnyConnection, now: number): boolean {
  if (!c.enabled || !hasCredential(c) || !c.syncInterval) {
    return false;
  }

  if (kind === 'jira' && !(c as JiraConfig).baseUrl) {
    return false;
  }

  if (kind === 'gitlab' && !(c as GitLabConfig).groupPath) {
    return false;
  }

  const last = c.lastSync ? Date.parse(c.lastSync) : 0;

  return now - last >= c.syncInterval * 60_000;
}

function configured(state: SyncState, kind: SyncKind): boolean {
  if (kind === 'jira') {
    return state.jiraConnections.some(
      (c) => c.enabled && Boolean(c.baseUrl) && hasCredential(c),
    );
  }

  if (kind === 'gitlab') {
    return state.gitlabConnections.some(
      (c) => c.enabled && Boolean(c.groupPath) && hasCredential(c),
    );
  }

  return state.githubConnections.some((c) => c.enabled && hasCredential(c));
}

function docText(res: RecordsResponse, key: string): string | undefined {
  const data = res.docs.find((d) => d.key === key)?.data;

  return typeof data === 'string' && data !== '' ? data : undefined;
}

/*
 * Runs the Jira, GitLab and GitHub syncs on the server (ADR-0019), with the exact code the
 * web app runs (src/modules/pm-tracker/sync-core, generated from the app). A run loads the
 * user's records, computes and applies each sync, and saves through the same
 * revision-checked commit a browser tab uses -- so an edit made in a tab meanwhile is
 * merged, never overwritten.
 */
@Injectable()
export class ServerSyncService implements OnModuleDestroy {
  private readonly logger = new Logger(ServerSyncService.name);

  private readonly running = new Map<string, Promise<ISyncOutcome>>();

  private readonly lastRuns = new Map<string, ISyncOutcome>();

  private readonly retryAt = new Map<string, { at: number; delay: number }>();

  private readonly hookTimers = new Map<string, NodeJS.Timeout>();

  private ticking = false;

  // Tests switch it on to exercise the sync while production has it off.
  isEnabled = isServerSyncEnabled;

  // Swapped in tests for a fake provider backend.
  transportFor: (userId: Uuid) => Transport;

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    pmTrackerService: PmTrackerService,
    @InjectRepository(PmTrackerHookEntity)
    private readonly hookRepo: Repository<PmTrackerHookEntity>,
  ) {
    this.transportFor = (userId) => serverTransport(pmTrackerService, userId);
  }

  // Pending webhook syncs must not keep a stopping process alive.
  onModuleDestroy(): void {
    for (const timer of this.hookTimers.values()) {
      clearTimeout(timer);
    }

    this.hookTimers.clear();
  }

  // One run per user at a time: a second request joins the one in progress.
  syncUser(userId: Uuid, request: ISyncRequest): Promise<ISyncOutcome> {
    if (!this.isEnabled) {
      return Promise.reject(
        new ServiceUnavailableException('error.serverSyncDisabled'),
      );
    }

    const inFlight = this.running.get(userId);

    if (inFlight) {
      return inFlight;
    }

    const run = this.run(userId, request).finally(() => {
      this.running.delete(userId);
    });

    this.running.set(userId, run);

    return run;
  }

  status(userId: Uuid): { running: boolean; lastRun: ISyncOutcome | null } {
    return {
      running: this.running.has(userId),
      lastRun: this.lastRuns.get(userId) ?? null,
    };
  }

  private async run(
    userId: Uuid,
    request: ISyncRequest,
  ): Promise<ISyncOutcome> {
    const startedAt = new Date().toISOString();

    await this.commandBus.execute(new MigrateStateToRecordsCommand(userId));

    const res = await this.queryBus.execute<GetRecordsQuery, RecordsResponse>(
      new GetRecordsQuery(userId),
    );
    const next = cloudToState(recordsToCloud(res));
    const records = new RecordTracker();

    records.reset(res, next);

    let state = {
      developers: [],
      projects: [],
      tasks: [],
      jiraConnections: [],
      gitlabConnections: [],
      githubConnections: [],
      ...next,
    } as unknown as SyncableState;

    records.adoptView(state);

    const tz = validZone(
      request.timezone ??
        docText(res, 'browserTimezone') ??
        docText(res, 'trackerTimezone'),
      '',
    );

    /*
     * Without the user's timezone "today" is unknowable: in UTC it is the wrong day for
     * four hours every night in Yerevan, and issues would land on yesterday's board.
     */
    if (!tz) {
      throw new BadRequestException('error.syncTimezoneUnknown');
    }

    const run: SyncRun = {
      background: request.background,
      today: latestWorkdayOn(dateInZone(Date.now(), tz)),
      tz,
    };
    const transport = this.transportFor(userId);
    const outcome: ISyncOutcome = {
      startedAt,
      finishedAt: startedAt,
      results: {},
      errors: [],
    };

    for (const kind of request.kinds ?? SYNC_KINDS) {
      if (!configured(state, kind)) {
        continue;
      }

      try {
        // eslint-disable-next-line no-await-in-loop -- one provider after another, as in the browser
        state = await this.syncKind(kind, state, transport, run, outcome);
      } catch (error) {
        outcome.errors.push({
          kind,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    await this.save(userId, records, state);
    outcome.finishedAt = new Date().toISOString();
    this.lastRuns.set(userId, outcome);

    return outcome;
  }

  private async syncKind(
    kind: SyncKind,
    state: SyncableState,
    transport: Transport,
    run: SyncRun,
    outcome: ISyncOutcome,
  ): Promise<SyncableState> {
    if (kind === 'jira') {
      const plan = await computeJiraSync(state, transport, run);

      outcome.results.jira = { ...plan.counts };

      return { ...state, ...applyJiraSync(state, plan) };
    }

    if (kind === 'gitlab') {
      const plan = await computeGitlabSync(state, transport, run);

      outcome.results.gitlab = { ...plan.counts };

      return { ...state, ...applyGitlabSync(state, plan) };
    }

    const plan = await computeGithubSync(state, transport, run);

    outcome.results.github = { ...plan.counts };

    return { ...state, ...applyGithubSync(state, plan) };
  }

  // Save what changed, merging with anything a tab saved meanwhile, until nothing differs.
  private async save(
    userId: Uuid,
    records: RecordTracker,
    initial: SyncableState,
  ): Promise<void> {
    let state = initial;

    for (let round = 0; round < MAX_SAVE_ROUNDS; round++) {
      const batch = records.collect(state);

      if (!batch) {
        return;
      }

      // eslint-disable-next-line no-await-in-loop -- each round depends on the previous answer
      const result = await this.commandBus.execute<
        CommitRecordsCommand,
        PmTrackerCommitResultDto
      >(
        new CommitRecordsCommand(
          userId,
          batch.body as unknown as CommitPmTrackerRecordsDto,
        ),
      );
      const out = records.apply(
        batch,
        result as unknown as CommitResponse,
        state,
      );

      if (out.patch) {
        state = { ...state, ...out.patch } as SyncableState;
      }

      if (out.answered === 0) {
        throw new Error('A sync save was answered for none of its records');
      }
    }

    throw new Error(
      `A sync save still conflicted after ${MAX_SAVE_ROUNDS} rounds`,
    );
  }

  /*
   * Every minute: run the syncs that are due -- a connection's own interval has passed
   * since it last synced, whether a browser or the server ran that sync. Users one at a
   * time, so memory stays bounded on the small instance.
   */
  @Interval(TICK_MS)
  async tick(): Promise<void> {
    if (!this.isEnabled || this.ticking) {
      return;
    }

    this.ticking = true;

    try {
      const due = await this.findDueUsers(Date.now());
      const deadline = Date.now() + TICK_BUDGET_MS;

      for (const { userId, kinds } of due) {
        // Out of time, or memory already high (a big page load in flight): the next tick continues.
        if (
          Date.now() > deadline ||
          process.memoryUsage().heapUsed > HEAP_CEILING_BYTES
        ) {
          break;
        }

        // eslint-disable-next-line no-await-in-loop -- sequential by design: bounds memory
        await this.runScheduled(userId, kinds);
      }
    } catch (error) {
      this.logger.error(
        'Scheduled sync tick failed',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.ticking = false;
    }
  }

  private async runScheduled(userId: Uuid, kinds: SyncKind[]): Promise<void> {
    try {
      const outcome = await this.syncUser(userId, { background: true, kinds });
      const failed = new Map(outcome.errors.map((e) => [e.kind, e.message]));

      for (const kind of kinds) {
        const reason = failed.get(kind);

        if (reason) {
          this.backOff(userId, kind, reason);
        } else {
          this.retryAt.delete(`${userId}:${kind}`);
        }
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);

      for (const kind of kinds) {
        this.backOff(userId, kind, reason);
      }
    }
  }

  // A failing provider (expired token, say) waits longer each time instead of retrying every minute.
  private backOff(userId: Uuid, kind: SyncKind, reason: string): void {
    const key = `${userId}:${kind}`;
    const previous = this.retryAt.get(key);
    const delay = Math.min(
      (previous?.delay ?? RETRY_BASE_MS / 2) * 2,
      RETRY_MAX_MS,
    );

    this.retryAt.set(key, { at: Date.now() + delay, delay });
    this.logger.warn(
      `Scheduled ${kind} sync for ${userId} failed (${reason}); next try in ${Math.round(delay / 60_000)} min`,
    );
  }

  /*
   * Users with at least one connection due, who may use the app (active account with a
   * current subscription or trial, or an admin) and whose timezone is known.
   */
  async findDueUsers(now: number): Promise<IDueUser[]> {
    const rows = await this.hookRepo.manager.query<
      Array<{ userId: Uuid; key: string; data: unknown }>
    >(
      `SELECT d.user_id AS "userId", d.key, d.data
       FROM pm_tracker_doc d
       JOIN users u ON u.id = d.user_id
       WHERE d.key IN ('jiraConnections', 'gitlabConnections', 'githubConnections', 'browserTimezone', 'trackerTimezone')
         AND u.status = 'ACTIVE'
         AND (u.role = 'SUPER_ADMIN'
           OR (u.subscription_active AND (u.subscription_until IS NULL OR u.subscription_until > now()))
           OR u.trial_until > now())`,
    );

    const byUser = new Map<Uuid, Map<string, unknown>>();

    for (const row of rows) {
      const docs = byUser.get(row.userId) ?? new Map<string, unknown>();

      docs.set(row.key, row.data);
      byUser.set(row.userId, docs);
    }

    const due: IDueUser[] = [];

    for (const [userId, docs] of byUser) {
      if (!docs.get('browserTimezone') && !docs.get('trackerTimezone')) {
        continue;
      }

      const kinds = SYNC_KINDS.filter((kind) => {
        const retry = this.retryAt.get(`${userId}:${kind}`);

        return (
          (!retry || retry.at <= now) &&
          this.connectionsFor(kind, docs).some((c) => isDue(kind, c, now))
        );
      });

      if (kinds.length > 0) {
        due.push({ userId, kinds });
      }
    }

    return due;
  }

  private connectionsFor(
    kind: SyncKind,
    docs: Map<string, unknown>,
  ): AnyConnection[] {
    const data = docs.get(`${kind}Connections`);

    return Array.isArray(data) ? (data as AnyConnection[]) : [];
  }

  // ── Webhooks ────────────────────────────────────────────────────────────────

  // The user's webhook path, created on first request. The token is the only secret.
  async hookPath(userId: Uuid): Promise<string> {
    const existing = await this.hookRepo
      .createQueryBuilder('h')
      .select(['h.token'])
      .where('h.user_id = :userId', { userId })
      .getOne();

    if (existing) {
      return `/pm-tracker/hooks/${existing.token}`;
    }

    const token = randomBytes(24).toString('base64url');

    await this.hookRepo
      .createQueryBuilder()
      .insert()
      .values({ userId, token })
      .orIgnore()
      .execute();

    return this.hookPath(userId);
  }

  /*
   * Jira, GitHub or GitLab reporting a change. The payload is not trusted or read: it
   * only prompts a background sync of that user, which fetches the truth itself.
   * Returns false for an unknown token.
   */
  async receiveHook(token: string): Promise<boolean> {
    const hook = await this.hookRepo
      .createQueryBuilder('h')
      .select(['h.userId'])
      .where('h.token = :token', { token })
      .getOne();

    if (!hook) {
      return false;
    }

    const { userId } = hook;
    const pending = this.hookTimers.get(userId);

    if (pending) {
      clearTimeout(pending);
    }

    this.hookTimers.set(
      userId,
      setTimeout(() => {
        this.hookTimers.delete(userId);
        void this.runScheduled(userId, SYNC_KINDS);
      }, HOOK_DEBOUNCE_MS),
    );

    return true;
  }
}
