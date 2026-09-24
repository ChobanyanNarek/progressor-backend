import '../../boilerplate.polyfill.ts';

import { gzipSync } from 'node:zlib';

import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  Body,
  ClassSerializerInterceptor,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  type INestApplication,
  Post,
  Query,
  Res,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import { ExpressAdapter } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import express, { type Response } from 'express';
import request from 'supertest';
import { DataSource, type Repository } from 'typeorm';

import { AccountStatus } from '../../constants/account-status.ts';
import { RoleType } from '../../constants/role-type.ts';
import { AddPmTrackerRecords1790177513294 } from '../../database/migrations/1790177513294-AddPmTrackerRecords.ts';
import { AddPmTrackerHook1790182444388 } from '../../database/migrations/1790182444388-AddPmTrackerHook.ts';
import { SnakeNamingStrategy } from '../../snake-naming.strategy.ts';
import { DeleteUserDataCommand } from '../admin-pm-tracker/commands/delete-user-data/delete-user-data.command.ts';
import { DeleteUserDataHandler } from '../admin-pm-tracker/commands/delete-user-data/delete-user-data.handler.ts';
import { GetAdminUsersHandler } from '../admin-pm-tracker/queries/get-admin-users/get-admin-users.handler.ts';
import { CommitRecordsCommand } from './commands/commit-records/commit-records.command.ts';
import { CommitRecordsHandler } from './commands/commit-records/commit-records.handler.ts';
import type { IMigrationOutcome } from './commands/migrate-state/migrate-state-to-records.command.ts';
import { MigrateStateToRecordsCommand } from './commands/migrate-state/migrate-state-to-records.command.ts';
import { MigrateStateToRecordsHandler } from './commands/migrate-state/migrate-state-to-records.handler.ts';
import { SavePmTrackerStateCommand } from './commands/save-state/save-pm-tracker-state.command.ts';
import { SavePmTrackerStateHandler } from './commands/save-state/save-pm-tracker-state.handler.ts';
import { syncTasksFromState } from './commands/sync-tasks/sync-tasks-from-state.ts';
import { CommitPmTrackerRecordsDto } from './dtos/commit-pm-tracker-records.dto.ts';
import type { PmTrackerCommitResultDto } from './dtos/pm-tracker-commit-result.dto.ts';
import type {
  PmTrackerDocRecordDto,
  PmTrackerRecordsDto,
  PmTrackerTaskRecordDto,
} from './dtos/pm-tracker-records.dto.ts';
import { PmTrackerRecordsQueryDto } from './dtos/pm-tracker-records-query.dto.ts';
import { PmTrackerCredentialEntity } from './entities/pm-tracker-credential.entity.ts';
import { PmTrackerDocEntity } from './entities/pm-tracker-doc.entity.ts';
import { PmTrackerHookEntity } from './entities/pm-tracker-hook.entity.ts';
import { PmTrackerTaskEntity } from './entities/pm-tracker-task.entity.ts';
import { PmTrackerTombstoneEntity } from './entities/pm-tracker-tombstone.entity.ts';
import { PmTrackerService } from './pm-tracker.service.ts';
import { PmTrackerStateEntity } from './pm-tracker-state.entity.ts';
import { GetRecordsHandler } from './queries/get-records/get-records.handler.ts';
import { GetRecordsQuery } from './queries/get-records/get-records.query.ts';
import { GetRecordsJsonHandler } from './queries/get-records-json/get-records-json.handler.ts';
import { GetPmTrackerStateHandler } from './queries/get-state/get-pm-tracker-state.handler.ts';
import { GetPmTrackerStateQuery } from './queries/get-state/get-pm-tracker-state.query.ts';
import { ServerSyncService } from './services/server-sync.service.ts';
import { dateInZone, latestWorkdayOn } from './sync-core/dates.ts';
import type { Transport, TransportResponse } from './sync-core/transport.ts';

/*
 * Per-record storage against a real Postgres: the SQL (compare-and-set writes, advisory
 * locks, jsonb_to_recordset, the migration's count check) is the thing under test, and a
 * mocked repository would prove none of it. Runs when PM_TRACKER_IT_DB points at a
 * THROWAWAY database -- the schema is dropped and rebuilt on every run. Skipped otherwise.
 */
const DB_URL = process.env.PM_TRACKER_IT_DB;
const describeDb = DB_URL ? describe : describe.skip;

const USER = '11111111-1111-4111-8111-111111111111' as Uuid;
const OTHER = '22222222-2222-4222-8222-222222222222' as Uuid;

// Shaped like the frontend's normalised Task, including fields only `rest` can carry.
function task(
  id: string,
  patch: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id,
    devId: 'd1',
    projectId: 'p1',
    title: 'Jira Issues',
    status: 'inprogress',
    jira: '',
    jiras: [
      {
        issueId: 'COM-1',
        url: 'https://x.atlassian.net/browse/COM-1',
        name: 'COM-1 Fix',
        status: 'todo',
        groupId: 'todo',
        jiraStatusName: 'To Do',
        prs: [],
        comment: '',
        priority: 'low',
        deadline: '',
        deadlineTime: '',
        statusHistory: [{ status: 'todo', at: '2026-09-01T10:00:00Z' }],
      },
    ],
    pr: '',
    prs: [],
    deadline: '',
    deadlineTime: '',
    reviewDate: '',
    reviewTime: '',
    comment: '',
    date: '2026-09-22',
    jiraSync: true,
    ...patch,
  };
}

function person(id: Uuid, email: string): Record<string, unknown> {
  return {
    id,
    email,
    firstName: 'Test',
    lastName: 'User',
    role: RoleType.CREATOR,
    status: AccountStatus.ACTIVE,
  };
}

// Just enough of the user repository for the admin list's one query.
function fakeUserRepo(users: unknown[]): unknown {
  const getMany = (): Promise<unknown[]> => Promise.resolve(users);
  const orderBy = (): unknown => ({ getMany });

  return { createQueryBuilder: (): unknown => ({ orderBy }) };
}

// The admin "delete data" handler only asks whether the user exists.
const userExists = (): Promise<boolean> => Promise.resolve(true);
const whereUser = (): unknown => ({ getExists: userExists });

function existingUserRepo(): unknown {
  return { createQueryBuilder: (): unknown => ({ where: whereUser }) };
}

// The pm-tracker tables as production has them before this change.
const BASE_SCHEMA = [
  `CREATE TABLE users (
     id uuid PRIMARY KEY, status varchar NOT NULL DEFAULT 'ACTIVE', role varchar NOT NULL DEFAULT 'CREATOR',
     subscription_active boolean NOT NULL DEFAULT false, subscription_until timestamp, trial_until timestamp)`,
  `CREATE TABLE pm_tracker_state (
     id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY, created_at TIMESTAMP NOT NULL DEFAULT now(),
     updated_at TIMESTAMP NOT NULL DEFAULT now(), workspace_key varchar, data jsonb NOT NULL, user_id uuid)`,
  `CREATE UNIQUE INDEX "UQ_pm_tracker_state_user_id" ON pm_tracker_state (user_id) WHERE user_id IS NOT NULL`,
  `CREATE TABLE pm_tracker_task (
     id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY, created_at TIMESTAMP NOT NULL DEFAULT now(),
     updated_at TIMESTAMP NOT NULL DEFAULT now(), user_id uuid NOT NULL, client_id varchar NOT NULL,
     dev_id varchar NOT NULL, project_id varchar NOT NULL, title varchar NOT NULL DEFAULT '', status varchar NOT NULL,
     date date NOT NULL, comment text, jiras jsonb NOT NULL DEFAULT '[]', rest jsonb NOT NULL DEFAULT '{}')`,
  `CREATE UNIQUE INDEX "IDX_pm_tracker_task_user_client" ON pm_tracker_task (user_id, client_id)`,
  `CREATE TABLE pm_tracker_credential (
     id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY, created_at TIMESTAMP NOT NULL DEFAULT now(),
     updated_at TIMESTAMP NOT NULL DEFAULT now(), user_id uuid NOT NULL, connection_id varchar NOT NULL,
     provider varchar(16) NOT NULL, secret text NOT NULL)`,
];

// What a value looks like after a trip through JSON (undefined fields dropped), unlike structuredClone.
// eslint-disable-next-line unicorn/prefer-structured-clone -- JSON semantics are the point
const asJson = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

const SYNC_TZ = 'Asia/Yerevan';

// The tracker's workday right now, as the server works it out.
const today = (): string => latestWorkdayOn(dateInZone(Date.now(), SYNC_TZ));

function answer(status: number, body: unknown): TransportResponse {
  const text = JSON.stringify(body);

  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(JSON.parse(text) as unknown),
    text: () => Promise.resolve(text),
  };
}

const jiraConnection = (
  patch: Record<string, unknown> = {},
): Record<string, unknown> => ({
  id: 'j1',
  name: 'Mabrook',
  enabled: true,
  baseUrl: 'https://mab.atlassian.net',
  email: 'a@b.c',
  token: 'tok',
  projectKeys: ['COM'],
  syncInterval: 5,
  projectId: 'p1',
  hoursPerDay: 8,
  developerEmails: { d1: ['dev@mab.com'] },
  statusMappings: [{ jiraStatus: 'To Do', groupId: 'todo' }],
  ...patch,
});
const syncBlob = (
  patch: Record<string, unknown> = {},
): Record<string, unknown> => ({
  developers: [
    { id: 'd1', name: 'Dev', color: '#000', role: 'dev', periods: [] },
  ],
  projects: [
    {
      id: 'p1',
      name: 'Mabrook',
      desc: '',
      color: '#000',
      members: ['d1'],
      nonWorkingDays: [0, 6],
    },
  ],
  jiraConnections: [jiraConnection()],
  browserTimezone: SYNC_TZ,
  tasks: [],
  ...patch,
});
const rawIssue = (key: string): Record<string, unknown> => ({
  key,
  fields: {
    summary: key,
    status: { name: 'To Do', statusCategory: { key: 'new' } },
    assignee: { emailAddress: 'dev@mab.com', displayName: 'Dev' },
  },
});

// A provider backend that answers every Jira search with these issues.
function jiraReturning(
  keys: string[],
  onSearch?: () => Promise<void>,
): Transport {
  return {
    post: async (path) => {
      if (path !== '/pm-tracker/jira-search') {
        return answer(200, {});
      }

      await onSearch?.();

      return answer(200, {
        issues: keys.map((key) => rawIssue(key)),
        truncated: false,
      });
    },
  };
}

const unreachable: Transport = {
  post: () => Promise.reject(new Error('GitLab is down')),
};

const toUnreachable = (): Transport => unreachable;

const failing: Transport = {
  post: () => Promise.resolve(answer(401, { message: 'bad token' })),
};

async function addUser(
  ds: DataSource,
  id: Uuid,
  patch: Record<string, unknown>,
): Promise<void> {
  await ds.query(
    `INSERT INTO users (id, status, role, subscription_active, subscription_until, trial_until) VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      id,
      patch.status ?? 'ACTIVE',
      patch.role ?? 'CREATOR',
      patch.active ?? true,
      patch.until ?? null,
      patch.trial ?? null,
    ],
  );
}

/*
 * The records routes as PmTrackerController declares them, minus authentication (a
 * passport guard with a live JWT strategy), so the HTTP contract -- validation, the
 * serializer, the JSON body parser, gzip -- is exercised exactly as in production.
 */
@Controller('pm-tracker')
class RecordsRoutesUnderTest {
  constructor(private readonly service: PmTrackerService) {}

  @Get('records')
  @HttpCode(HttpStatus.OK)
  async getRecords(
    @Query() query: PmTrackerRecordsQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    res
      .type('application/json')
      .send(await this.service.getRecordsJson(USER, query.since));
  }

  @Post('records/commit')
  @HttpCode(HttpStatus.OK)
  commitRecords(@Body() dto: CommitPmTrackerRecordsDto): Promise<unknown> {
    return this.service.commitRecords(USER, dto);
  }
}

describeDb('pm-tracker per-record storage (Postgres)', () => {
  let ds: DataSource;
  let stateRepo: Repository<PmTrackerStateEntity>;
  let taskRepo: Repository<PmTrackerTaskEntity>;
  let migrate: MigrateStateToRecordsHandler;
  let commit: CommitRecordsHandler;
  let records: GetRecordsHandler;

  const run = (userId: Uuid): Promise<IMigrationOutcome> =>
    migrate.execute(new MigrateStateToRecordsCommand(userId));
  const save = (
    dto: CommitPmTrackerRecordsDto,
    userId = USER,
  ): Promise<PmTrackerCommitResultDto> =>
    commit.execute(new CommitRecordsCommand(userId, dto));
  const load = (since?: number, userId = USER): Promise<PmTrackerRecordsDto> =>
    records.execute(new GetRecordsQuery(userId, since));

  // Single-value lookups, so each assertion reads one thing.
  async function tasksOf(userId = USER): Promise<PmTrackerTaskRecordDto[]> {
    const snapshot = await load(undefined, userId);

    return snapshot.tasks;
  }

  async function docsOf(): Promise<PmTrackerDocRecordDto[]> {
    const snapshot = await load();

    return snapshot.docs;
  }

  async function taskRecord(id: string): Promise<PmTrackerTaskRecordDto> {
    const tasks = await tasksOf();

    return tasks.find((t) => t.id === id)!;
  }

  async function docRecord(key: string): Promise<PmTrackerDocRecordDto> {
    const docs = await docsOf();

    return docs.find((d) => d.key === key)!;
  }

  async function cursorNow(): Promise<number> {
    const snapshot = await load();

    return snapshot.cursor;
  }

  async function seedBlob(
    userId: Uuid,
    data: Record<string, unknown>,
  ): Promise<void> {
    await ds.query(
      `INSERT INTO pm_tracker_state (user_id, workspace_key, data) VALUES ($1, NULL, $2::jsonb)`,
      [userId, JSON.stringify(data)],
    );
  }

  beforeAll(async () => {
    ds = new DataSource({
      type: 'postgres',
      url: DB_URL,
      namingStrategy: new SnakeNamingStrategy(),
      entities: [
        PmTrackerStateEntity,
        PmTrackerTaskEntity,
        PmTrackerDocEntity,
        PmTrackerTombstoneEntity,
        PmTrackerCredentialEntity,
        PmTrackerHookEntity,
      ],
    });
    await ds.initialize();

    await ds.query(
      `DROP SCHEMA public CASCADE; CREATE SCHEMA public; CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
    );

    for (const sql of BASE_SCHEMA) {
      // eslint-disable-next-line no-await-in-loop -- schema statements run in order
      await ds.query(sql);
    }

    // ...then this change's migration on top.
    const runner = ds.createQueryRunner();
    await new AddPmTrackerRecords1790177513294().up(runner);
    await new AddPmTrackerHook1790182444388().up(runner);
    await runner.release();

    stateRepo = ds.getRepository(PmTrackerStateEntity);
    taskRepo = ds.getRepository(PmTrackerTaskEntity);
    migrate = new MigrateStateToRecordsHandler(stateRepo);
    commit = new CommitRecordsHandler(stateRepo);
    records = new GetRecordsHandler(stateRepo);
  });

  afterAll(async () => {
    await ds.destroy();
  });

  beforeEach(async () => {
    await ds.query(
      `TRUNCATE users, pm_tracker_state, pm_tracker_task, pm_tracker_doc, pm_tracker_tombstone, pm_tracker_credential, pm_tracker_hook`,
    );
  });

  describe('moving a blob into records', () => {
    const blob = {
      _v: 2,
      developers: [{ id: 'd1', name: 'Dev' }],
      projects: [{ id: 'p1', name: 'Mabrook' }],
      jiraConnections: [{ id: 'j1', enabled: true, token: '' }],
      selectedDate: '2026-09-22',
      notifsEnabled: false,
      tasks: [
        task('t1'),
        task('t2', { date: '2026-09-23', comment: 'kept', carriedOver: true }),
        { id: 'broken' }, // no date: cannot be stored
        task('t3', { title: 'first copy' }),
        task('t3', { title: 'second copy' }), // repeated id: the later copy wins
      ],
    };

    it('copies every section and every storable task exactly', async () => {
      await seedBlob(USER, blob);

      const outcome = await run(USER);

      expect(outcome).toEqual({
        migrated: true,
        tasks: 3,
        docs: 5,
        skippedTasks: 1,
      });

      const snapshot = await load();
      const docs = Object.fromEntries(
        snapshot.docs.map((d) => [d.key, d.data]),
      );

      expect(docs).toEqual({
        developers: blob.developers,
        projects: blob.projects,
        jiraConnections: blob.jiraConnections,
        selectedDate: '2026-09-22',
        notifsEnabled: false, // a false value is real data, not "missing"
      });

      const tasks = Object.fromEntries(
        snapshot.tasks.map((t) => [t.id, t.data]),
      );

      expect(tasks.t1).toEqual(blob.tasks[0]);
      expect(tasks.t2).toEqual(blob.tasks[1]);
      expect(tasks.t3).toEqual(blob.tasks[4]);
      expect(snapshot.full).toBe(true);
      expect(snapshot.cursor).toBeGreaterThan(0);
    });

    it('creates no record for a section the blob does not have', async () => {
      await seedBlob(USER, { tasks: [task('t1')] });
      await run(USER);

      await expect(docsOf()).resolves.toEqual([]);
    });

    it('leaves the blob untouched as the backup, and runs only once', async () => {
      await seedBlob(USER, blob);
      await run(USER);

      const [row] = await ds.query(
        `SELECT data, migrated_at FROM pm_tracker_state WHERE user_id = $1`,
        [USER],
      );

      expect(row.data).toEqual(blob);
      expect(row.migrated_at).not.toBeNull();

      // Records change afterwards; a second run must not copy the blob over them.
      const projects = await docRecord('projects');

      await save({
        docs: [{ key: 'projects', data: [], baseRevision: projects.revision }],
      });

      await expect(run(USER)).resolves.toMatchObject({ migrated: false });

      const after = await docRecord('projects');

      expect(after.data).toEqual([]);
    });

    it('replaces rows the old mirror table left behind', async () => {
      await ds.query(
        `INSERT INTO pm_tracker_task (user_id, client_id, dev_id, project_id, status, date) VALUES ($1, 'stale', 'd1', 'p1', 'todo', '2026-01-01')`,
        [USER],
      );
      await seedBlob(USER, { tasks: [task('t1')] });
      await run(USER);

      const tasks = await tasksOf();

      expect(tasks.map((t) => t.id)).toEqual(['t1']);
    });

    it('starts a new user with an empty, already-migrated row', async () => {
      expect(await run(USER)).toEqual({
        migrated: true,
        tasks: 0,
        docs: 0,
        skippedTasks: 0,
      });
      await expect(tasksOf()).resolves.toEqual([]);
    });

    it('is safe when two first loads race', async () => {
      await seedBlob(USER, blob);

      const outcomes = await Promise.all([run(USER), run(USER), run(USER)]);

      expect(outcomes.filter((o) => o.migrated)).toHaveLength(1);
      await expect(tasksOf()).resolves.toHaveLength(3);
    });

    it('does not touch another user', async () => {
      await seedBlob(USER, blob);
      await seedBlob(OTHER, { tasks: [task('o1')] });
      await run(USER);

      await expect(tasksOf(OTHER)).resolves.toEqual([]);
    });
  });

  describe('the blob endpoints after migration', () => {
    it('refuses a whole-blob save from an old tab', async () => {
      await seedBlob(USER, { tasks: [task('t1')] });
      await run(USER);

      const handler = new SavePmTrackerStateHandler(stateRepo, taskRepo);

      await expect(
        handler.execute(new SavePmTrackerStateCommand(USER, { tasks: [] })),
      ).rejects.toBeInstanceOf(ConflictException);
      await expect(tasksOf()).resolves.toHaveLength(1);
    });

    it('still accepts blob saves from users not yet migrated', async () => {
      await seedBlob(USER, { tasks: [] });

      const handler = new SavePmTrackerStateHandler(stateRepo, taskRepo);

      await expect(
        handler.execute(
          new SavePmTrackerStateCommand(USER, { tasks: [task('t1')] }),
        ),
      ).resolves.toBeDefined();
    });

    it('serves GET /state from the records, in the old shape', async () => {
      await seedBlob(USER, { developers: [{ id: 'd1' }], tasks: [task('t1')] });
      await run(USER);
      const t1 = await taskRecord('t1');

      await save({
        tasks: [
          {
            id: 't1',
            data: task('t1', { title: 'renamed' }),
            baseRevision: t1.revision,
          },
        ],
      });

      const handler = new GetPmTrackerStateHandler(stateRepo, {
        execute: (q: GetRecordsQuery) => records.execute(q),
      } as never);
      const state = await handler.execute(new GetPmTrackerStateQuery(USER));

      expect(state!.data).toEqual({
        _v: 3,
        developers: [{ id: 'd1' }],
        tasks: [task('t1', { title: 'renamed' })],
      });
      // ...without writing that back into the backup.
      const [row] = await ds.query(
        `SELECT data FROM pm_tracker_state WHERE user_id = $1`,
        [USER],
      );

      expect(row.data.tasks[0].title).toBe('Jira Issues');
    });

    it('stops the old mirror refresh from writing over records', async () => {
      await seedBlob(USER, { tasks: [task('t1')] });
      await run(USER);

      await syncTasksFromState(taskRepo, USER, { tasks: [] });

      await expect(tasksOf()).resolves.toHaveLength(1);
    });
  });

  describe('committing changes', () => {
    beforeEach(async () => {
      await seedBlob(USER, { projects: [{ id: 'p1' }], tasks: [task('t1')] });
      await run(USER);
    });

    it('applies a write made from the current revision, and bumps it', async () => {
      const t1 = await taskRecord('t1');
      const result = await save({
        tasks: [
          {
            id: 't1',
            data: task('t1', { comment: 'edited' }),
            baseRevision: t1.revision,
          },
        ],
      });

      expect(result.conflicts).toEqual([]);
      expect(result.applied[0]!.revision).toBeGreaterThan(t1.revision);
      const stored = await taskRecord('t1');

      expect(stored.data.comment).toBe('edited');
    });

    it('refuses a stale write and returns the newer copy instead', async () => {
      const t1 = await taskRecord('t1');

      await save({
        tasks: [
          {
            id: 't1',
            data: task('t1', { comment: 'tab A' }),
            baseRevision: t1.revision,
          },
        ],
      });
      const stale = await save({
        tasks: [
          {
            id: 't1',
            data: task('t1', { comment: 'tab B' }),
            baseRevision: t1.revision,
          },
        ],
      });

      expect(stale.applied).toEqual([]);
      expect(stale.conflicts).toHaveLength(1);
      expect(stale.conflicts[0]!.data).toMatchObject({ comment: 'tab A' });
      const stored = await taskRecord('t1');

      expect(stored.data.comment).toBe('tab A');
    });

    it('lets exactly one of two simultaneous writes from the same revision land', async () => {
      const t1 = await taskRecord('t1');
      const results = await Promise.all(
        ['A', 'B', 'C'].map((tab) =>
          save({
            tasks: [
              {
                id: 't1',
                data: task('t1', { comment: tab }),
                baseRevision: t1.revision,
              },
            ],
          }),
        ),
      );

      expect(results.filter((r) => r.applied.length === 1)).toHaveLength(1);
      expect(results.filter((r) => r.conflicts.length === 1)).toHaveLength(2);
    });

    it('treats creating an id that already exists as a conflict', async () => {
      const result = await save({
        tasks: [{ id: 't1', data: task('t1'), baseRevision: null }],
      });

      expect(result.conflicts[0]).toMatchObject({ kind: 'task', id: 't1' });
    });

    it('keeps the writes that match even when others conflict', async () => {
      const result = await save({
        tasks: [
          { id: 't1', data: task('t1'), baseRevision: 1 }, // stale
          { id: 't9', data: task('t9'), baseRevision: null }, // new
        ],
      });

      expect(result.applied.map((a) => a.id)).toEqual(['t9']);
      expect(result.conflicts.map((c) => c.id)).toEqual(['t1']);
    });

    it('rejects, rather than half-stores, a task with no usable date or a bad section name', async () => {
      const result = await save({
        tasks: [
          { id: 'x', data: task('x', { date: 'soon' }), baseRevision: null },
        ],
        docs: [{ key: 'tasks', data: [], baseRevision: null }],
      });

      expect(result.rejected).toEqual([
        { kind: 'doc', id: 'tasks', reason: 'error.invalidRecord' },
        { kind: 'task', id: 'x', reason: 'error.invalidRecord' },
      ]);
      expect(result.applied).toEqual([]);
    });

    it('deletes from the current revision and records a tombstone', async () => {
      const [t1, before] = await Promise.all([taskRecord('t1'), cursorNow()]);
      const result = await save({
        deletes: [{ id: 't1', baseRevision: t1.revision }],
      });

      expect(result.applied[0]).toMatchObject({ kind: 'delete', id: 't1' });

      const changes = await load(before);

      expect(changes.deleted.map((d) => d.id)).toEqual(['t1']);
      expect(changes.tasks).toEqual([]);
    });

    it('keeps a task that changed after the deleting tab last saw it', async () => {
      const t1 = await taskRecord('t1');

      await save({
        tasks: [
          {
            id: 't1',
            data: task('t1', { comment: 'newer' }),
            baseRevision: t1.revision,
          },
        ],
      });
      const result = await save({
        deletes: [{ id: 't1', baseRevision: t1.revision }],
      });

      expect(result.conflicts[0]).toMatchObject({ kind: 'delete', id: 't1' });
      const stored = await taskRecord('t1');

      expect(stored.data.comment).toBe('newer');
    });

    it('accepts deleting something already deleted elsewhere', async () => {
      const t1 = await taskRecord('t1');

      await save({ deletes: [{ id: 't1', baseRevision: t1.revision }] });
      const again = await save({
        deletes: [{ id: 't1', baseRevision: t1.revision }],
      });

      expect(again.applied).toHaveLength(1);
      expect(again.conflicts).toEqual([]);
    });

    it('clears the tombstone when the id is written again', async () => {
      const [t1, start] = await Promise.all([taskRecord('t1'), cursorNow()]);

      await save({ deletes: [{ id: 't1', baseRevision: t1.revision }] });
      await save({
        tasks: [{ id: 't1', data: task('t1'), baseRevision: null }],
      });

      const changes = await load(start);

      expect(changes.deleted).toEqual([]);
      expect(changes.tasks.map((t) => t.id)).toEqual(['t1']);
    });

    it('guards settings sections the same way', async () => {
      const projects = await docRecord('projects');

      await save({
        docs: [
          {
            key: 'projects',
            data: [{ id: 'p1' }, { id: 'p2' }],
            baseRevision: projects.revision,
          },
        ],
      });
      const stale = await save({
        docs: [{ key: 'projects', data: [], baseRevision: projects.revision }],
      });

      expect(stale.conflicts[0]).toMatchObject({
        kind: 'doc',
        id: 'projects',
        data: [{ id: 'p1' }, { id: 'p2' }],
      });

      const created = await save({
        docs: [{ key: 'notes', data: [{ id: 'n1' }], baseRevision: null }],
      });

      expect(created.applied).toHaveLength(1);
    });

    it('reports only what changed since a cursor', async () => {
      const start = await load();
      const t1 = start.tasks[0]!;

      await save({
        tasks: [
          {
            id: 't1',
            data: task('t1', { comment: 'x' }),
            baseRevision: t1.revision,
          },
          { id: 't2', data: task('t2'), baseRevision: null },
        ],
      });

      const changes = await load(start.cursor);

      expect(changes.full).toBe(false);
      expect(changes.tasks.map((t) => t.id)).toEqual(
        expect.arrayContaining(['t1', 't2']),
      );
      expect(changes.tasks).toHaveLength(2);
      expect(changes.docs).toEqual([]);
      expect(changes.cursor).toBeGreaterThan(start.cursor);
      const later = await load(changes.cursor);

      expect(later.tasks).toEqual([]);
    });

    it("never touches another user's records", async () => {
      await seedBlob(OTHER, { tasks: [task('t1', { comment: 'theirs' })] });
      await run(OTHER);
      const mine = await taskRecord('t1');

      await save({
        tasks: [
          {
            id: 't1',
            data: task('t1', { comment: 'mine' }),
            baseRevision: mine.revision,
          },
        ],
      });

      const theirs = await tasksOf(OTHER);

      expect(theirs[0]!.data.comment).toBe('theirs');
    });
  });

  describe('admin', () => {
    const userRepo = fakeUserRepo([
      person(USER, 'a@example.com'),
      person(OTHER, 'b@example.com'),
    ]);

    it('counts from records once migrated and from the blob before', async () => {
      await seedBlob(USER, {
        developers: [{ id: 'd1' }],
        projects: [],
        tasks: [],
      });
      await run(USER);
      const devs = await docRecord('developers');

      await save({
        docs: [
          {
            key: 'developers',
            data: [{ id: 'd1' }, { id: 'd2' }],
            baseRevision: devs.revision,
          },
        ],
      });
      await seedBlob(OTHER, {
        developers: [{ id: 'x' }],
        projects: [{ id: 'p' }, { id: 'q' }],
        jiraConnections: [{ id: 'j', enabled: true, token: 't' }],
      });

      const handler = new GetAdminUsersHandler(
        userRepo as never,
        stateRepo,
        ds.getRepository(PmTrackerCredentialEntity),
      );
      const result = await handler.execute();
      const byId = Object.fromEntries(result.users.map((u) => [u.id, u]));

      expect(byId[USER]).toMatchObject({
        devCount: 2,
        projectCount: 0,
        jiraConnected: false,
      });
      expect(byId[OTHER]).toMatchObject({
        devCount: 1,
        projectCount: 2,
        jiraConnected: true,
      });
    });

    it("deleting a user's data clears the records too", async () => {
      await seedBlob(USER, { developers: [], tasks: [task('t1')] });
      await run(USER);

      const handler = new DeleteUserDataHandler(
        existingUserRepo() as never,
        stateRepo,
      );

      await handler.execute(new DeleteUserDataCommand(USER));

      const [{ n }] = await ds.query(
        `SELECT (SELECT count(*) FROM pm_tracker_task) + (SELECT count(*) FROM pm_tracker_doc) + (SELECT count(*) FROM pm_tracker_state) AS n`,
      );

      expect(Number(n)).toBe(0);
    });
  });

  describe('over HTTP, as the web app calls it', () => {
    let app: INestApplication;

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          CqrsModule,
          TypeOrmModule.forRoot({
            type: 'postgres',
            url: DB_URL,
            namingStrategy: new SnakeNamingStrategy(),
            entities: [
              PmTrackerStateEntity,
              PmTrackerTaskEntity,
              PmTrackerDocEntity,
              PmTrackerTombstoneEntity,
            ],
          }),
          TypeOrmModule.forFeature([
            PmTrackerStateEntity,
            PmTrackerTaskEntity,
            PmTrackerDocEntity,
            PmTrackerTombstoneEntity,
          ]),
        ],
        controllers: [RecordsRoutesUnderTest],
        providers: [
          PmTrackerService,
          MigrateStateToRecordsHandler,
          CommitRecordsHandler,
          GetRecordsHandler,
          GetRecordsJsonHandler,
        ],
      }).compile();

      // main.ts's body parser and global pipes.
      const server = express();

      server.disable('x-powered-by');

      server.use(express.json({ limit: '20mb' }));
      app = moduleRef.createNestApplication(new ExpressAdapter(server), {
        bodyParser: false,
      });
      app.useGlobalInterceptors(
        new ClassSerializerInterceptor(app.get(Reflector)),
      );
      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          transform: true,
          dismissDefaultMessages: true,
          forbidNonWhitelisted: true,
          exceptionFactory: (errors) =>
            new UnprocessableEntityException(errors),
        }),
      );
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    // The web app gzips every save.
    const commitGzipped = (body: unknown): request.Test =>
      request(app.getHttpServer())
        .post('/pm-tracker/records/commit')
        .type('application/json')
        .set('Content-Encoding', 'gzip')
        // Send the gzip bytes as they are; supertest would otherwise JSON-encode the Buffer.
        .serialize((raw: unknown) => raw as string)
        .send(gzipSync(JSON.stringify(body)));

    it('loads, saves a gzipped change, and reports it as a change since the cursor', async () => {
      await seedBlob(USER, { developers: [{ id: 'd1' }], tasks: [task('t1')] });

      const first = await request(app.getHttpServer())
        .get('/pm-tracker/records')
        .expect(200);

      expect(first.body.full).toBe(true);
      expect(first.body.tasks[0].data).toEqual(task('t1'));
      expect(typeof first.body.tasks[0].revision).toBe('number');
      expect(first.body.docs).toEqual([
        {
          key: 'developers',
          data: [{ id: 'd1' }],
          revision: expect.any(Number),
        },
      ]);

      const saved = await commitGzipped({
        docs: [{ key: 'notifsEnabled', data: false, baseRevision: null }],
        tasks: [
          {
            id: 't1',
            data: task('t1', { comment: 'x' }),
            baseRevision: first.body.tasks[0].revision,
          },
        ],
        deletes: [],
      }).expect(200);

      expect(saved.body.applied).toHaveLength(2);
      expect(saved.body.conflicts).toEqual([]);

      const changes = await request(app.getHttpServer())
        .get(`/pm-tracker/records?since=${first.body.cursor}`)
        .expect(200);

      expect(changes.body.full).toBe(false);
      expect(
        changes.body.tasks.map(
          (t: { data: { comment: string } }) => t.data.comment,
        ),
      ).toEqual(['x']);
      expect(changes.body.docs).toEqual([
        { key: 'notifsEnabled', data: false, revision: expect.any(Number) },
      ]);
    });

    it('answers a stale write with the current copy', async () => {
      await seedBlob(USER, { tasks: [task('t1')] });

      const first = await request(app.getHttpServer())
        .get('/pm-tracker/records')
        .expect(200);
      const base = first.body.tasks[0].revision;

      await commitGzipped({
        tasks: [
          { id: 't1', data: task('t1', { comment: 'A' }), baseRevision: base },
        ],
      }).expect(200);
      const stale = await commitGzipped({
        tasks: [
          { id: 't1', data: task('t1', { comment: 'B' }), baseRevision: base },
        ],
      }).expect(200);

      expect(stale.body.conflicts).toEqual([
        {
          kind: 'task',
          id: 't1',
          data: task('t1', { comment: 'A' }),
          revision: expect.any(Number),
        },
      ]);
    });

    it('writes exactly what the object path returns, for awkward tasks too', async () => {
      await seedBlob(USER, {
        developers: [{ id: 'd1', name: String.raw`Zoë "the" dev \ ☃` }],
        trackerTimezone: null,
        tasks: [
          task('t1'),
          task('t2', {
            title: 42,
            comment: undefined,
            extra: { nested: [1, null, 'x'] },
          }), // coerced title kept in rest
          task('t3', { comment: 'line\nbreak "quoted" ☃', jiras: [] }),
        ],
      });

      // In order: the HTTP load moves the blob into records, which the direct read then sees.
      // eslint-disable-next-line awesome-nest/prefer-promise-all -- the second read must follow the first
      const http = await request(app.getHttpServer())
        .get('/pm-tracker/records')
        .expect(200);
      const direct = await load();

      expect(http.headers['content-type']).toContain('application/json');
      expect(http.body).toEqual(asJson(direct));
      expect(
        http.body.tasks.find((t: { id: string }) => t.id === 't2').data.title,
      ).toBe(42);

      // ...and for a changes-only answer with a tombstone.
      const t1 = direct.tasks.find((t) => t.id === 't1')!;

      await commitGzipped({
        deletes: [{ id: 't1', baseRevision: t1.revision }],
      }).expect(200);

      const changes = await request(app.getHttpServer())
        .get(`/pm-tracker/records?since=${direct.cursor}`)
        .expect(200);

      expect(changes.body).toEqual(asJson(await load(direct.cursor)));
      expect(changes.body.deleted.map((d: { id: string }) => d.id)).toEqual([
        't1',
      ]);
    });

    it('rejects a malformed save with 422 instead of storing part of it', async () => {
      await request(app.getHttpServer())
        .post('/pm-tracker/records/commit')
        .send({
          tasks: [{ id: 't1', data: 'not an object', baseRevision: null }],
        })
        .expect(422);
    });
  });

  describe('server-side sync', () => {
    let sync: ServerSyncService;

    beforeEach(() => {
      const commandBus = {
        execute: (command: unknown) =>
          command instanceof MigrateStateToRecordsCommand
            ? migrate.execute(command)
            : commit.execute(command as CommitRecordsCommand),
      };
      const queryBus = {
        execute: (query: GetRecordsQuery) => records.execute(query),
      };

      sync = new ServerSyncService(
        commandBus as never,
        queryBus as never,
        {} as never,
        ds.getRepository(PmTrackerHookEntity),
      );
      sync.isEnabled = true;
    });

    afterEach(() => {
      sync.onModuleDestroy();
    });

    it("runs the web app's Jira sync and saves the result as records", async () => {
      await seedBlob(USER, syncBlob());
      sync.transportFor = () => jiraReturning(['COM-1', 'COM-2']);

      const outcome = await sync.syncUser(USER, { background: true });

      expect(outcome.errors).toEqual([]);
      expect(outcome.results.jira).toEqual({
        added: 2,
        updated: 0,
        removed: 0,
      });

      const tasks = await tasksOf();

      expect(tasks).toHaveLength(1);
      expect(tasks[0]!.data).toMatchObject({
        devId: 'd1',
        projectId: 'p1',
        date: today(),
        jiraSync: true,
      });
      expect(
        (tasks[0]!.data.jiras as Array<{ issueId: string }>).map(
          (j) => j.issueId,
        ),
      ).toEqual(['COM-1', 'COM-2']);

      const jiraDoc = await docRecord('jiraConnections');
      const conns = jiraDoc.data as Array<{ lastSync?: string }>;

      expect(Date.parse(conns[0]!.lastSync!)).toBeGreaterThan(
        Date.now() - 60_000,
      );
    });

    it('merges an edit a browser saved while the sync was running', async () => {
      await seedBlob(
        USER,
        syncBlob({ tasks: [task('t1', { date: today(), jiras: [] })] }),
      );
      await run(USER);

      // Mid-sync, a tab comments on the task the sync is about to fill.
      const commentFromTab = async (): Promise<void> => {
        const current = await taskRecord('t1');

        await save({
          tasks: [
            {
              id: 't1',
              data: { ...current.data, comment: 'typed in a tab' },
              baseRevision: current.revision,
            },
          ],
        });
      };

      const midSync = jiraReturning(['COM-1'], commentFromTab);

      sync.transportFor = () => midSync;

      await sync.syncUser(USER, { background: true });

      const t1 = await taskRecord('t1');

      expect(t1.data.comment).toBe('typed in a tab');
      expect(
        (t1.data.jiras as Array<{ issueId: string }>).map((j) => j.issueId),
      ).toEqual(['COM-1']);
    });

    it('refuses to guess the day without a timezone', async () => {
      await seedBlob(USER, syncBlob({ browserTimezone: undefined }));
      sync.transportFor = () => jiraReturning([]);

      await expect(sync.syncUser(USER, { background: true })).rejects.toThrow(
        'error.syncTimezoneUnknown',
      );
      // A manual sync brings the browser's zone with it.
      await expect(
        sync.syncUser(USER, { background: false, timezone: SYNC_TZ }),
      ).resolves.toMatchObject({ errors: [] });
    });

    it('reports a provider failure without losing the other providers', async () => {
      await seedBlob(
        USER,
        syncBlob({
          jiraConnections: [
            jiraConnection({ baseUrl: 'https://mab.atlassian.net' }),
          ],
        }),
      );
      sync.transportFor = () => failing;

      const outcome = await sync.syncUser(USER, { background: true });

      // Per-developer Jira failures are skipped by the sync itself, as in the browser.
      expect(outcome.errors).toEqual([]);
      await expect(tasksOf()).resolves.toEqual([]);
    });

    describe('which users are due', () => {
      it('picks users whose connection interval has passed, and skips the rest', async () => {
        const recent = new Date().toISOString();

        await addUser(ds, USER, {});
        await seedBlob(USER, syncBlob());
        await run(USER);
        await addUser(ds, OTHER, {});
        await seedBlob(
          OTHER,
          syncBlob({ jiraConnections: [jiraConnection({ lastSync: recent })] }),
        );
        await run(OTHER);

        await expect(sync.findDueUsers(Date.now())).resolves.toEqual([
          { userId: USER, kinds: ['jira'] },
        ]);
      });

      it('skips users without a current subscription or timezone', async () => {
        await addUser(ds, USER, { active: false });
        await seedBlob(USER, syncBlob());
        await run(USER);
        await addUser(ds, OTHER, {});
        await seedBlob(OTHER, syncBlob({ browserTimezone: undefined }));
        await run(OTHER);

        await expect(sync.findDueUsers(Date.now())).resolves.toEqual([]);
      });

      it('counts a trial or an admin as allowed', async () => {
        await addUser(ds, USER, {
          active: false,
          trial: new Date(Date.now() + 86_400_000),
        });
        await seedBlob(USER, syncBlob());
        await run(USER);

        await expect(sync.findDueUsers(Date.now())).resolves.toHaveLength(1);
      });

      it('backs off a provider that keeps failing', async () => {
        const gitlab = {
          id: 'gl1',
          name: 'GL',
          enabled: true,
          token: 'tok',
          groupPath: 'acme',
          syncInterval: 5,
          projectId: 'p1',
        };

        await addUser(ds, USER, {});
        await seedBlob(
          USER,
          syncBlob({ jiraConnections: [], gitlabConnections: [gitlab] }),
        );
        await run(USER);
        sync.transportFor = toUnreachable;

        await sync.tick();

        // The failure left lastSync alone, so without backoff it would be due again at once.
        const gitlabDoc = await docRecord('gitlabConnections');
        const conns = gitlabDoc.data as Array<{ lastSync?: string }>;

        expect(conns[0]!.lastSync).toBeUndefined();
        await expect(sync.findDueUsers(Date.now() + 60_000)).resolves.toEqual(
          [],
        );
        await expect(
          sync.findDueUsers(Date.now() + 6 * 60_000),
        ).resolves.toEqual([{ userId: USER, kinds: ['gitlab'] }]);
      });
    });

    it('runs nothing while switched off', async () => {
      await seedBlob(USER, syncBlob());
      sync.isEnabled = false;
      sync.transportFor = () => jiraReturning(['COM-1']);

      await expect(sync.syncUser(USER, { background: true })).rejects.toThrow(
        'error.serverSyncDisabled',
      );
      await sync.tick();
      await expect(tasksOf()).resolves.toEqual([]);
    });

    describe('webhooks', () => {
      it('gives each user one stable, secret path', async () => {
        const first = await sync.hookPath(USER);

        expect(first).toMatch(/^\/pm-tracker\/hooks\/[\w-]{32}$/);
        await expect(sync.hookPath(USER)).resolves.toBe(first);
        await expect(sync.hookPath(OTHER)).resolves.not.toBe(first);
      });

      it('accepts only a known token', async () => {
        const path = await sync.hookPath(USER);

        await expect(sync.receiveHook(path.split('/').pop()!)).resolves.toBe(
          true,
        );
        await expect(sync.receiveHook('not-a-token')).resolves.toBe(false);
      });
    });
  });
});
