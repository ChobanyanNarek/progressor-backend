import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { type EntityManager, Repository } from 'typeorm';

import { PmTrackerStateEntity } from '../../pm-tracker-state.entity.ts';
import {
  isDocKey,
  type ITaskRow,
  lockUser,
  queryRows,
  REVISION_SEQUENCE,
  taskToRow,
} from '../../records/record-mapping.ts';
import {
  type IMigrationOutcome,
  MigrateStateToRecordsCommand,
} from './migrate-state-to-records.command.ts';

const INSERT_CHUNK = 500;

/*
 * One multi-row INSERT per chunk, all values passed as a single JSON parameter, so the
 * statement never approaches Postgres's bind-parameter limit.
 */
export async function insertTaskRows(
  manager: EntityManager,
  userId: Uuid,
  rows: ITaskRow[],
): Promise<void> {
  if (rows.length === 0) {
    return;
  }

  await manager.query(
    `INSERT INTO pm_tracker_task (user_id, client_id, dev_id, project_id, title, status, date, comment, jiras, rest, revision)
     SELECT $1, r."clientId", r."devId", r."projectId", r.title, r.status, r.date::date, r.comment, r.jiras, r.rest,
       nextval('${REVISION_SEQUENCE}')
     FROM jsonb_to_recordset($2::jsonb) AS r(
       "clientId" text, "devId" text, "projectId" text, title text, status text, date text, comment text, jiras jsonb, rest jsonb
     )`,
    // ITaskRow's keys are exactly the recordset's column names.
    [userId, JSON.stringify(rows)],
  );
}

/*
 * Copies a user's pm_tracker_state blob into per-record storage, once (ADR-0018).
 *
 * Safety rules:
 * - The blob row is never modified beyond stamping migrated_at: it stays as the backup.
 * - Everything happens in one transaction. The copied task count is checked against the
 *   blob before committing; on any mismatch or error nothing is kept and the user stays
 *   on the blob.
 * - Only what is really there is copied: a section missing from the blob gets no record,
 *   and a task that cannot be stored (no id or date) is counted and logged, not invented.
 *   If the blob holds the same task id twice, the later copy wins, as it did on the client.
 */
@Injectable()
@CommandHandler(MigrateStateToRecordsCommand)
export class MigrateStateToRecordsHandler
  implements ICommandHandler<MigrateStateToRecordsCommand>
{
  private readonly logger = new Logger(MigrateStateToRecordsHandler.name);

  constructor(
    @InjectRepository(PmTrackerStateEntity)
    private readonly stateRepo: Repository<PmTrackerStateEntity>,
  ) {}

  async execute(
    command: MigrateStateToRecordsCommand,
  ): Promise<IMigrationOutcome> {
    const { userId } = command;

    // Cheap check first, without the blob, so the usual case costs one tiny query.
    const isMigrated = await this.stateRepo
      .createQueryBuilder('s')
      .select(['s.id'])
      .where('s.user_id = :userId AND s.migrated_at IS NOT NULL', { userId })
      .getExists();

    if (isMigrated) {
      return { migrated: false, tasks: 0, docs: 0, skippedTasks: 0 };
    }

    const outcome = await this.stateRepo.manager.transaction((manager) =>
      this.migrate(manager, userId),
    );

    if (outcome.migrated) {
      this.logger.log(
        `Moved user ${userId} to per-record storage: ${outcome.tasks} tasks, ${outcome.docs} sections, ` +
          `${outcome.skippedTasks} unstorable tasks left in the blob`,
      );
    }

    return outcome;
  }

  private async migrate(
    manager: EntityManager,
    userId: Uuid,
  ): Promise<IMigrationOutcome> {
    await lockUser(manager, userId);

    const rows = await manager.query<
      Array<{
        id: Uuid;
        data: Record<string, unknown>;
        migratedAt: Date | null;
      }>
    >(
      `SELECT id, data, migrated_at AS "migratedAt" FROM pm_tracker_state WHERE user_id = $1 FOR UPDATE`,
      [userId],
    );
    let state = rows[0];

    // Another request finished the migration while this one waited for the lock.
    if (state?.migratedAt) {
      return { migrated: false, tasks: 0, docs: 0, skippedTasks: 0 };
    }

    if (!state) {
      // The pre-accounts shared workspace, claimed by the first user to load (as GET /state does).
      const legacy = await queryRows<{
        id: Uuid;
        data: Record<string, unknown>;
        migratedAt: null;
      }>(
        manager,
        `UPDATE pm_tracker_state SET user_id = $1
         WHERE id = (SELECT id FROM pm_tracker_state WHERE workspace_key = 'default' AND user_id IS NULL LIMIT 1 FOR UPDATE)
         RETURNING id, data, migrated_at AS "migratedAt"`,
        [userId],
      );
      state = legacy[0];
    }

    if (!state) {
      // A new user: nothing to copy. Create the row so the blob endpoint knows to refuse writes.
      await manager.query(
        `INSERT INTO pm_tracker_state (user_id, workspace_key, data, migrated_at) VALUES ($1, NULL, '{}'::jsonb, now())`,
        [userId],
      );

      return { migrated: true, tasks: 0, docs: 0, skippedTasks: 0 };
    }

    const { id: stateId, data } = state;

    // Sections: every top-level key except tasks, copied as-is.
    const docKeys = Object.keys(data).filter(
      (key) => isDocKey(key) && data[key] !== undefined,
    );

    for (const key of docKeys) {
      // eslint-disable-next-line no-await-in-loop -- one statement per section, a handful per user
      await manager.query(
        `INSERT INTO pm_tracker_doc (user_id, key, data, revision)
         VALUES ($1, $2, $3::jsonb, nextval('${REVISION_SEQUENCE}'))
         ON CONFLICT (user_id, key) DO UPDATE SET data = EXCLUDED.data, revision = EXCLUDED.revision, updated_at = now()`,
        [userId, key, JSON.stringify(data[key])],
      );
    }

    // Tasks: one row each, replacing whatever the old mirror table held.
    const rawTasks = Array.isArray(data.tasks) ? (data.tasks as unknown[]) : [];
    const byId = new Map<string, ITaskRow>();
    let skippedTasks = 0;

    for (const raw of rawTasks) {
      const row =
        raw && typeof raw === 'object'
          ? taskToRow(raw as Record<string, unknown>)
          : null;

      if (row) {
        byId.set(row.clientId, row);
      } else {
        skippedTasks++;
      }
    }

    const duplicates = rawTasks.length - skippedTasks - byId.size;

    await manager.query(`DELETE FROM pm_tracker_task WHERE user_id = $1`, [
      userId,
    ]);
    await manager.query(`DELETE FROM pm_tracker_tombstone WHERE user_id = $1`, [
      userId,
    ]);

    const taskRows = [...byId.values()];

    for (let i = 0; i < taskRows.length; i += INSERT_CHUNK) {
      // eslint-disable-next-line no-await-in-loop -- sequential by design: bounds statement size
      await insertTaskRows(
        manager,
        userId,
        taskRows.slice(i, i + INSERT_CHUNK),
      );
    }

    const counted = await queryRows<{ count: string }>(
      manager,
      `SELECT count(*) FROM pm_tracker_task WHERE user_id = $1`,
      [userId],
    );
    const count = Number(counted[0]?.count ?? -1);

    if (count !== taskRows.length) {
      // Throwing rolls everything back; the blob stays the source of truth.
      throw new Error(
        `pm-tracker migration check failed for ${userId}: ${count} rows for ${taskRows.length} tasks`,
      );
    }

    await manager.query(
      `UPDATE pm_tracker_state SET migrated_at = now() WHERE id = $1`,
      [stateId],
    );

    if (duplicates > 0) {
      this.logger.warn(
        `User ${userId}: blob held ${duplicates} repeated task ids; kept the last copy of each`,
      );
    }

    return {
      migrated: true,
      tasks: taskRows.length,
      docs: docKeys.length,
      skippedTasks,
    };
  }
}
