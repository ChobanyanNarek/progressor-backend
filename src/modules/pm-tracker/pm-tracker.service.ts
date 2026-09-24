import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import type { PageDto } from '../../common/dto/page.dto.ts';
import { CommitRecordsCommand } from './commands/commit-records/commit-records.command.ts';
import { DeleteCredentialCommand } from './commands/delete-credential/delete-credential.command.ts';
import { MigrateStateToRecordsCommand } from './commands/migrate-state/migrate-state-to-records.command.ts';
import { ReportClientErrorCommand } from './commands/report-client-error/report-client-error.command.ts';
import { SaveCredentialCommand } from './commands/save-credential/save-credential.command.ts';
import { SavePmTrackerStateCommand } from './commands/save-state/save-pm-tracker-state.command.ts';
import type { CommitPmTrackerRecordsDto } from './dtos/commit-pm-tracker-records.dto.ts';
import type {
  JiraBoardIssuesRequestDto,
  JiraBoardsRequestDto,
  JiraSearchRequestDto,
  JiraSearchResultDto,
  JiraSprintsRequestDto,
  JiraStatusesRequestDto,
} from './dtos/jira-proxy.dto.ts';
import type { PmTrackerCommitResultDto } from './dtos/pm-tracker-commit-result.dto.ts';
import type { PmTrackerCredentialListDto } from './dtos/pm-tracker-credential-list.dto.ts';
import type { PmTrackerTaskDto } from './dtos/pm-tracker-task.dto.ts';
import {
  type GithubProxyRequestDto,
  GithubProxyResultDto,
  type GitlabProxyRequestDto,
  GitlabProxyResultDto,
} from './dtos/provider-proxy.dto.ts';
import type { ReleaseNoteTaskDto } from './dtos/release-note-task.dto.ts';
import type { ReleaseNoteTasksPageOptionsDto } from './dtos/release-note-tasks-page-options.dto.ts';
import type { ReportClientErrorDto } from './dtos/report-client-error.dto.ts';
import type { SavePmTrackerCredentialDto } from './dtos/save-pm-tracker-credential.dto.ts';
import type { SavePmTrackerStateDto } from './dtos/save-pm-tracker-state.dto.ts';
import type { SearchTasksPageOptionsDto } from './dtos/search-tasks-page-options.dto.ts';
import type { PmTrackerStateEntity } from './pm-tracker-state.entity.ts';
import { GetRecordsJsonQuery } from './queries/get-records-json/get-records-json.query.ts';
import { GetPmTrackerStateQuery } from './queries/get-state/get-pm-tracker-state.query.ts';
import { ListCredentialsQuery } from './queries/list-credentials/list-credentials.query.ts';
import { ReleaseNoteTasksQuery } from './queries/release-note-tasks/release-note-tasks.query.ts';
import { ResolveCredentialQuery } from './queries/resolve-credential/resolve-credential.query.ts';
import { SearchTasksQuery } from './queries/search-tasks/search-tasks.query.ts';

/*
 * The only provider endpoints the web app calls. A proxy path must match one of these, on
 * the provider's fixed API host, so a stored token can only be used the way the app uses
 * it -- never to reach an arbitrary URL, and never for a write.
 */
export const GITHUB_PATHS: RegExp[] = [
  /^\/repos(?:\/[\w.-]+){2}\/pul{2}s(\/\d+)?(\?[^#]*)?$/,
  /^\/(orgs|users)\/[\w.-]+\/repos(\?[^#]*)?$/,
  /^\/search\/issues(\?[^#]*)?$/,
];

export const GITLAB_PATHS: RegExp[] = [
  /^\/api\/v4\/(groups|projects|users)\/[\w%.-]+\/merge_requests(\?[^#]*)?$/,
];

/*
 * Jira calls send the user's credentials to `baseUrl`, so it must really be an Atlassian
 * Cloud site. A substring test let https://evil.example/?atlassian.net through; now the
 * host itself must be *.atlassian.net, over https. The server-side sync calls these
 * automatically, which makes the difference matter more.
 */
export function assertAtlassianUrl(baseUrl: string): void {
  let url: URL | null = null;

  try {
    url = new URL(baseUrl);
  } catch {
    url = null;
  }

  if (url?.protocol !== 'https:' || !url.hostname.endsWith('.atlassian.net')) {
    throw new BadRequestException(
      'Only Atlassian Cloud URLs (*.atlassian.net) are supported',
    );
  }
}

export function assertAllowedPath(path: string, allowed: RegExp[]): void {
  if (path.includes('..') || !allowed.some((re) => re.test(path))) {
    throw new BadRequestException('error.proxyPathNotAllowed');
  }
}

@Injectable()
export class PmTrackerService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  reportClientError(
    userId: Uuid,
    report: ReportClientErrorDto,
    userAgent: string | undefined,
  ): Promise<void> {
    return this.commandBus.execute(
      new ReportClientErrorCommand(userId, report, userAgent),
    );
  }

  getState(userId: Uuid): Promise<PmTrackerStateEntity | null> {
    return this.queryBus.execute<
      GetPmTrackerStateQuery,
      PmTrackerStateEntity | null
    >(new GetPmTrackerStateQuery(userId));
  }

  /*
   * Per-record storage (ADR-0018). Both calls first make sure the user's blob has been
   * copied into records -- a no-op after the first time.
   */
  // The response body, already JSON (see GetRecordsJsonHandler for why).
  async getRecordsJson(userId: Uuid, since?: number): Promise<string> {
    await this.commandBus.execute(new MigrateStateToRecordsCommand(userId));

    return this.queryBus.execute<GetRecordsJsonQuery, string>(
      new GetRecordsJsonQuery(userId, since),
    );
  }

  async commitRecords(
    userId: Uuid,
    dto: CommitPmTrackerRecordsDto,
  ): Promise<PmTrackerCommitResultDto> {
    await this.commandBus.execute(new MigrateStateToRecordsCommand(userId));

    return this.commandBus.execute<
      CommitRecordsCommand,
      PmTrackerCommitResultDto
    >(new CommitRecordsCommand(userId, dto));
  }

  saveState(
    userId: Uuid,
    data: Record<string, unknown>,
  ): Promise<SavePmTrackerStateDto> {
    return this.commandBus.execute<
      SavePmTrackerStateCommand,
      SavePmTrackerStateDto
    >(new SavePmTrackerStateCommand(userId, data));
  }

  searchTasks(
    userId: Uuid,
    pageOptionsDto: SearchTasksPageOptionsDto,
  ): Promise<PageDto<PmTrackerTaskDto>> {
    return this.queryBus.execute<SearchTasksQuery, PageDto<PmTrackerTaskDto>>(
      new SearchTasksQuery(userId, pageOptionsDto),
    );
  }

  releaseNoteTasks(
    userId: Uuid,
    pageOptionsDto: ReleaseNoteTasksPageOptionsDto,
  ): Promise<PageDto<ReleaseNoteTaskDto>> {
    return this.queryBus.execute<
      ReleaseNoteTasksQuery,
      PageDto<ReleaseNoteTaskDto>
    >(new ReleaseNoteTasksQuery(userId, pageOptionsDto));
  }

  /*
   * Fill in the token for a proxy call: taken from the request while the client still
   * holds it, otherwise decrypted from the vault by connection id. Credentials are always
   * looked up under the calling user, so a connection id cannot reach another user's token.
   */
  async withResolvedToken<T extends { token?: string; connectionId?: string }>(
    userId: Uuid,
    dto: T,
  ): Promise<T & { token: string }> {
    if (dto.token) {
      return { ...dto, token: dto.token };
    }

    if (!dto.connectionId) {
      throw new BadRequestException('error.credentialRequired');
    }

    const token = await this.queryBus.execute<ResolveCredentialQuery, string>(
      new ResolveCredentialQuery(userId, dto.connectionId),
    );

    return { ...dto, token };
  }

  saveCredential(
    userId: Uuid,
    connectionId: string,
    dto: SavePmTrackerCredentialDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new SaveCredentialCommand(userId, connectionId, dto.provider, dto.secret),
    );
  }

  deleteCredential(userId: Uuid, connectionId: string): Promise<void> {
    return this.commandBus.execute(
      new DeleteCredentialCommand(userId, connectionId),
    );
  }

  listCredentials(userId: Uuid): Promise<PmTrackerCredentialListDto> {
    return this.queryBus.execute<
      ListCredentialsQuery,
      PmTrackerCredentialListDto
    >(new ListCredentialsQuery(userId));
  }

  async githubProxy(
    userId: Uuid,
    dto: GithubProxyRequestDto,
  ): Promise<GithubProxyResultDto> {
    assertAllowedPath(dto.path, GITHUB_PATHS);
    const { token } = await this.withResolvedToken(userId, dto);
    // HTTP header names aren't identifiers, so they're built from pairs.
    const res = await fetch(`https://api.github.com${dto.path}`, {
      headers: Object.fromEntries([
        ['Authorization', `Bearer ${token}`],
        ['Accept', 'application/vnd.github+json'],
        ['X-GitHub-Api-Version', '2022-11-28'],
      ]),
    });

    // Plain object, not DTO.create: class-transformer over a 100-PR page blocked the loop.
    return {
      status: res.status,
      data: await res.json().catch(() => null),
    } as GithubProxyResultDto;
  }

  async gitlabProxy(
    userId: Uuid,
    dto: GitlabProxyRequestDto,
  ): Promise<GitlabProxyResultDto> {
    assertAllowedPath(dto.path, GITLAB_PATHS);
    const { token } = await this.withResolvedToken(userId, dto);
    const res = await fetch(`https://gitlab.com${dto.path}`, {
      headers: Object.fromEntries([
        ['PRIVATE-TOKEN', token],
        ['Accept', 'application/json'],
      ]),
    });

    // Plain object, not DTO.create: see githubProxy.
    return {
      status: res.status,
      data: await res.json().catch(() => null),
    } as GitlabProxyResultDto;
  }

  async jiraSearch(dto: JiraSearchRequestDto): Promise<JiraSearchResultDto> {
    const { baseUrl, email, token, jql } = dto;

    assertAtlassianUrl(baseUrl);

    const auth = Buffer.from(`${email}:${token}`).toString('base64');
    const headers: Record<string, string> = {
      // biome-ignore lint/style/useNamingConvention: HTTP header names are PascalCase by spec
      Authorization: `Basic ${auth}`,
      // biome-ignore lint/style/useNamingConvention: HTTP header names are PascalCase by spec
      Accept: 'application/json',
    };

    // Cursor-paginated (this endpoint uses nextPageToken, not startAt) so a developer with
    // more than one page of matching issues doesn't get silently cut off — a fixed single
    // page previously caused issues beyond it to look "unassigned" and be pruned in
    // production. Memory-bounded the same way as jiraBoardIssues: cap total accumulated
    // issues, and only request the heavy `expand=changelog` for the first page.
    const allIssues: Array<Record<string, unknown>> = [];
    const maxResults = 50;
    // 1000 issues x ~2.5KB is ~2.4MB peak per request, which the 512MB instance absorbs
    // comfortably -- the memory risk is the changelog expansion (first page only) and the
    // number of concurrent syncs, not the issue count. At 400 an open, assigned issue on a
    // busy developer fell off the end of the `updated DESC` ordering and never arrived,
    // which looks identical to the issue not existing.
    const MAX_TOTAL = 1000;
    const CHANGELOG_PAGES = 1;
    let pageToken: string | undefined;
    let page = 0;

    while (true) {
      const params = new URLSearchParams({
        jql,
        fields:
          'summary,status,priority,duedate,assignee,created,timeoriginalestimate,timespent,customfield_10016,customfield_10028,issuetype,parent',
        maxResults: String(maxResults),
      });
      if (page < CHANGELOG_PAGES) params.set('expand', 'changelog');
      if (pageToken) params.set('nextPageToken', pageToken);

      const url = `${baseUrl.replace(/\/$/, '')}/rest/api/3/search/jql?${params.toString()}`;
      const res = await fetch(url, { headers });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new HttpException(text || res.statusText, res.status);
      }

      const data = (await res.json()) as {
        issues?: Array<Record<string, unknown>>;
        isLast?: boolean;
        nextPageToken?: string;
      };
      const issues = data.issues ?? [];
      allIssues.push(...issues);
      page += 1;

      const exhausted = data.isLast !== false && !data.nextPageToken;
      if (exhausted || allIssues.length >= MAX_TOTAL) {
        // truncated only when the cap cut us off before Jira's own results ran out —
        // callers must not treat an absent issue as "no longer assigned" in that case.
        return { issues: allIssues, truncated: !exhausted } as JiraSearchResultDto;
      }
      pageToken = data.nextPageToken;
    }
  }

  async jiraTimeTracking(dto: JiraStatusesRequestDto): Promise<Record<string, unknown>> {
    const { baseUrl, email, token } = dto;

    assertAtlassianUrl(baseUrl);

    const url = `${baseUrl.replace(/\/$/, '')}/rest/api/3/configuration/timetracking/options`;
    const auth = Buffer.from(`${email}:${token}`).toString('base64');
    const headers: Record<string, string> = {
      // biome-ignore lint/style/useNamingConvention: HTTP header names are PascalCase by spec
      Authorization: `Basic ${auth}`,
      // biome-ignore lint/style/useNamingConvention: HTTP header names are PascalCase by spec
      Accept: 'application/json',
    };

    const res = await fetch(url, { headers });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new HttpException(text || res.statusText, res.status);
    }
    return res.json() as Promise<Record<string, unknown>>;
  }

  async jiraStatuses(
    dto: JiraStatusesRequestDto,
  ): Promise<Array<Record<string, unknown>>> {
    const { baseUrl, email, token } = dto;

    assertAtlassianUrl(baseUrl);

    const url = `${baseUrl.replace(/\/$/, '')}/rest/api/3/status`;
    const auth = Buffer.from(`${email}:${token}`).toString('base64');

    const headers: Record<string, string> = {
      // biome-ignore lint/style/useNamingConvention: HTTP header names are PascalCase by spec
      Authorization: `Basic ${auth}`,
      // biome-ignore lint/style/useNamingConvention: HTTP header names are PascalCase by spec
      Accept: 'application/json',
    };

    const res = await fetch(url, { headers });

    if (!res.ok) {
      const text = await res.text().catch(() => '');

      throw new HttpException(text || res.statusText, res.status);
    }

    return res.json() as Promise<Array<Record<string, unknown>>>;
  }

  async jiraBoards(
    dto: JiraBoardsRequestDto,
  ): Promise<Array<Record<string, unknown>>> {
    const { baseUrl, email, token } = dto;

    assertAtlassianUrl(baseUrl);

    const auth = Buffer.from(`${email}:${token}`).toString('base64');
    const headers: Record<string, string> = {
      // biome-ignore lint/style/useNamingConvention: HTTP header names are PascalCase by spec
      Authorization: `Basic ${auth}`,
      // biome-ignore lint/style/useNamingConvention: HTTP header names are PascalCase by spec
      Accept: 'application/json',
    };

    const boards: Array<Record<string, unknown>> = [];
    let startAt = 0;
    const maxResults = 50;

    while (true) {
      const params = new URLSearchParams({
        startAt: String(startAt),
        maxResults: String(maxResults),
      });
      const url = `${baseUrl.replace(/\/$/, '')}/rest/agile/1.0/board?${params.toString()}`;
      const res = await fetch(url, { headers });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new HttpException(text || res.statusText, res.status);
      }

      const data = (await res.json()) as {
        values?: Array<Record<string, unknown>>;
        isLast?: boolean;
        total?: number;
      };

      boards.push(...(data.values ?? []));

      if (data.isLast || boards.length >= (data.total ?? 0)) break;
      startAt += maxResults;
    }

    return boards;
  }

  async jiraBoardIssues(dto: JiraBoardIssuesRequestDto): Promise<JiraSearchResultDto> {
    const { baseUrl, email, token, boardId, assigneeEmail } = dto;

    assertAtlassianUrl(baseUrl);

    const auth = Buffer.from(`${email}:${token}`).toString('base64');
    const headers: Record<string, string> = {
      // biome-ignore lint/style/useNamingConvention: HTTP header names are PascalCase by spec
      Authorization: `Basic ${auth}`,
      // biome-ignore lint/style/useNamingConvention: HTTP header names are PascalCase by spec
      Accept: 'application/json',
    };

    // Agile board issues filtered by assignee across ALL sprints AND the backlog — not just
    // open sprints — so the tracker mirrors what the user sees on the board in Jira. Match
    // the assignee by full email OR username (local-part) since some instances key on either.
    // Fully paginated so boards with more than one page of issues are not truncated.
    const localPart = assigneeEmail?.includes('@')
      ? assigneeEmail.slice(0, assigneeEmail.indexOf('@'))
      : assigneeEmail;
    const assigneeVals = [...new Set([assigneeEmail, localPart].filter(Boolean))]
      .map((v) => `"${v}"`)
      .join(', ');
    const jql = assigneeVals ? `assignee in (${assigneeVals})` : '';

    // Memory-bounded pagination. Board fetches run per-developer and can return many issues;
    // to avoid exhausting a small instance we (a) cap total accumulated issues, and (b) only
    // request the heavy `expand=changelog` for the FIRST page. Status history for later-page
    // issues is simply omitted (buildStatusHistory tolerates a missing changelog) — a fair
    // trade to keep the service from OOM-restarting during a large sync. A single developer's
    // actual assigned-issue count on one board is realistically in the tens to low hundreds,
    // so these are a safety backstop against a pathological board, not a normal-case limit —
    // tightened from 1500/3 pages after a production OOM restart traced in part to this fetch.
    const allIssues: Array<Record<string, unknown>> = [];
    let startAt = 0;
    const maxResults = 50;
    // 1000 issues x ~2.5KB is ~2.4MB peak per request, which the 512MB instance absorbs
    // comfortably -- the memory risk is the changelog expansion (first page only) and the
    // number of concurrent syncs, not the issue count. At 400 an open, assigned issue on a
    // busy developer fell off the end of the `updated DESC` ordering and never arrived,
    // which looks identical to the issue not existing.
    const MAX_TOTAL = 1000;
    const CHANGELOG_PAGES = 1;  // expand changelog only on the very first page
    let page = 0;

    while (true) {
      const params = new URLSearchParams({
        fields:
          'summary,status,priority,duedate,assignee,created,timeoriginalestimate,timespent,customfield_10016,customfield_10028,issuetype,parent',
        startAt: String(startAt),
        maxResults: String(maxResults),
      });
      if (page < CHANGELOG_PAGES) params.set('expand', 'changelog');
      if (jql) params.set('jql', jql);
      const url = `${baseUrl.replace(/\/$/, '')}/rest/agile/1.0/board/${boardId}/issue?${params.toString()}`;
      const res = await fetch(url, { headers });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new HttpException(text || res.statusText, res.status);
      }

      const data = (await res.json()) as {
        issues?: Array<Record<string, unknown>>;
        total?: number;
      };
      const issues = data.issues ?? [];
      allIssues.push(...issues);

      startAt += maxResults;
      page += 1;
      const exhausted = issues.length < maxResults || startAt >= (data.total ?? 0);
      if (exhausted || allIssues.length >= MAX_TOTAL) {
        // truncated only when the cap cut us off before Jira's own results ran out —
        // callers must not treat an absent issue as "no longer assigned" in that case.
        return { issues: allIssues, truncated: !exhausted } as JiraSearchResultDto;
      }
    }
  }

  // Return the FULL set of issue keys on a board — assignee-agnostic and sprint-agnostic,
  // fully paginated. This is the accurate board-membership signal used by the tracker to
  // decide which issues belong to a board. (jiraBoardIssues is intentionally narrower:
  // per-assignee, open-sprint only — it must NOT be used to resolve board membership.)
  async jiraBoardKeys(dto: JiraSprintsRequestDto): Promise<{ keys: string[] }> {
    const { baseUrl, email, token, boardId } = dto;

    assertAtlassianUrl(baseUrl);

    const auth = Buffer.from(`${email}:${token}`).toString('base64');
    const headers: Record<string, string> = {
      // biome-ignore lint/style/useNamingConvention: HTTP header names are PascalCase by spec
      Authorization: `Basic ${auth}`,
      // biome-ignore lint/style/useNamingConvention: HTTP header names are PascalCase by spec
      Accept: 'application/json',
    };

    const keys = new Set<string>();
    let startAt = 0;
    const maxResults = 100;
    const MAX_KEYS = 5000;

    while (true) {
      const params = new URLSearchParams({
        // no JQL filter: every issue on the board, any assignee, any sprint/backlog
        fields: 'key',
        startAt: String(startAt),
        maxResults: String(maxResults),
      });
      const url = `${baseUrl.replace(/\/$/, '')}/rest/agile/1.0/board/${boardId}/issue?${params.toString()}`;
      const res = await fetch(url, { headers });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new HttpException(text || res.statusText, res.status);
      }

      const data = (await res.json()) as {
        issues?: Array<{ key?: string }>;
        total?: number;
      };
      const issues = data.issues ?? [];
      for (const issue of issues) {
        if (issue.key) keys.add(issue.key.toUpperCase());
      }

      startAt += maxResults;
      if (issues.length < maxResults || startAt >= (data.total ?? 0) || keys.size >= MAX_KEYS) break;
    }

    return { keys: [...keys] };
  }

  async jiraSprints(
    dto: JiraSprintsRequestDto,
  ): Promise<Array<Record<string, unknown>>> {
    const { baseUrl, email, token, boardId } = dto;

    assertAtlassianUrl(baseUrl);

    const auth = Buffer.from(`${email}:${token}`).toString('base64');
    const headers: Record<string, string> = {
      // biome-ignore lint/style/useNamingConvention: HTTP header names are PascalCase by spec
      Authorization: `Basic ${auth}`,
      // biome-ignore lint/style/useNamingConvention: HTTP header names are PascalCase by spec
      Accept: 'application/json',
    };

    const params = new URLSearchParams({ state: 'active,future', maxResults: '50' });
    const url = `${baseUrl.replace(/\/$/, '')}/rest/agile/1.0/board/${boardId}/sprint?${params.toString()}`;
    const res = await fetch(url, { headers });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new HttpException(text || res.statusText, res.status);
    }

    const data = (await res.json()) as { values?: Array<Record<string, unknown>> };
    return data.values ?? [];
  }
}
