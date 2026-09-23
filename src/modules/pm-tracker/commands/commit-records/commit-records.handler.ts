import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { type EntityManager, Repository } from 'typeorm';

import { PmTrackerCommitResultDto } from '../../dtos/pm-tracker-commit-result.dto.ts';
import { PmTrackerStateEntity } from '../../pm-tracker-state.entity.ts';
import {
  isDocKey,
  type IStoredTaskRow,
  type ITaskRow,
  lockUser,
  queryRows,
  REVISION_SEQUENCE,
  rowToTask,
  TASK_COLUMNS,
  taskToRow,
} from '../../records/record-mapping.ts';
import { CommitRecordsCommand } from './commit-records.command.ts';

interface IApplied {
  kind: string;
  id: string;
  revision: number;
}

interface IConflict {
  kind: string;
  id: string;
  data?: unknown;
  revision?: number;
}

interface IRejected {
  kind: string;
  id: string;
  reason: string;
}

interface IOutcome {
  applied: IApplied[];
  conflicts: IConflict[];
  rejected: IRejected[];
}

async function writeDoc(
  manager: EntityManager,
  userId: Uuid,
  write: { key: string; data: unknown; baseRevision: number | null },
  result: IOutcome,
): Promise<void> {
  if (!isDocKey(write.key)) {
    result.rejected.push({
      kind: 'doc',
      id: write.key,
      reason: 'error.invalidRecord',
    });

    return;
  }

  const json = JSON.stringify(write.data ?? null);
  const written =
    write.baseRevision === null
      ? await queryRows<{ revision: string }>(
          manager,
          `INSERT INTO pm_tracker_doc (user_id, key, data, revision)
           VALUES ($1, $2, $3::jsonb, nextval('${REVISION_SEQUENCE}'))
           ON CONFLICT (user_id, key) DO NOTHING RETURNING revision`,
          [userId, write.key, json],
        )
      : await queryRows<{ revision: string }>(
          manager,
          `UPDATE pm_tracker_doc SET data = $3::jsonb, revision = nextval('${REVISION_SEQUENCE}'), updated_at = now()
           WHERE user_id = $1 AND key = $2 AND revision = $4 RETURNING revision`,
          [userId, write.key, json, write.baseRevision],
        );

  if (written[0]) {
    result.applied.push({
      kind: 'doc',
      id: write.key,
      revision: Number(written[0].revision),
    });

    return;
  }

  const current = await queryRows<{ data: unknown; revision: string }>(
    manager,
    `SELECT data, revision FROM pm_tracker_doc WHERE user_id = $1 AND key = $2`,
    [userId, write.key],
  );

  result.conflicts.push(
    current[0]
      ? {
          kind: 'doc',
          id: write.key,
          data: current[0].data,
          revision: Number(current[0].revision),
        }
      : { kind: 'doc', id: write.key },
  );
}

async function writeTask(
  manager: EntityManager,
  userId: Uuid,
  write: {
    id: string;
    data: Record<string, unknown>;
    baseRevision: number | null;
  },
  result: IOutcome,
): Promise<void> {
  const row: ITaskRow | null = taskToRow({ ...write.data, id: write.id });

  if (!row) {
    result.rejected.push({
      kind: 'task',
      id: write.id,
      reason: 'error.invalidRecord',
    });

    return;
  }

  const values = [
    userId,
    row.clientId,
    row.devId,
    row.projectId,
    row.title,
    row.status,
    row.date,
    row.comment,
    JSON.stringify(row.jiras),
    JSON.stringify(row.rest),
  ];
  const written =
    write.baseRevision === null
      ? await queryRows<{ revision: string }>(
          manager,
          `INSERT INTO pm_tracker_task (user_id, client_id, dev_id, project_id, title, status, date, comment, jiras, rest, revision)
           VALUES ($1, $2, $3, $4, $5, $6, $7::date, $8, $9::jsonb, $10::jsonb, nextval('${REVISION_SEQUENCE}'))
           ON CONFLICT (user_id, client_id) DO NOTHING RETURNING revision`,
          values,
        )
      : await queryRows<{ revision: string }>(
          manager,
          `UPDATE pm_tracker_task SET dev_id = $3, project_id = $4, title = $5, status = $6, date = $7::date, comment = $8,
             jiras = $9::jsonb, rest = $10::jsonb, revision = nextval('${REVISION_SEQUENCE}'), updated_at = now()
           WHERE user_id = $1 AND client_id = $2 AND revision = $11 RETURNING revision`,
          [...values, write.baseRevision],
        );

  if (written[0]) {
    // A task written again under a deleted id is alive: drop its tombstone.
    await manager.query(
      `DELETE FROM pm_tracker_tombstone WHERE user_id = $1 AND record_id = $2`,
      [userId, row.clientId],
    );
    result.applied.push({
      kind: 'task',
      id: row.clientId,
      revision: Number(written[0].revision),
    });

    return;
  }

  const current = await queryRows<IStoredTaskRow>(
    manager,
    `SELECT ${TASK_COLUMNS} FROM pm_tracker_task WHERE user_id = $1 AND client_id = $2`,
    [userId, row.clientId],
  );

  result.conflicts.push(
    current[0]
      ? {
          kind: 'task',
          id: row.clientId,
          data: rowToTask(current[0]),
          revision: Number(current[0].revision),
        }
      : { kind: 'task', id: row.clientId },
  );
}

async function deleteTask(
  manager: EntityManager,
  userId: Uuid,
  del: { id: string; baseRevision: number },
  result: IOutcome,
): Promise<void> {
  const removed = await queryRows<{ clientId: string }>(
    manager,
    `DELETE FROM pm_tracker_task WHERE user_id = $1 AND client_id = $2 AND revision = $3 RETURNING client_id AS "clientId"`,
    [userId, del.id, del.baseRevision],
  );

  if (!removed[0]) {
    const current = await queryRows<IStoredTaskRow>(
      manager,
      `SELECT ${TASK_COLUMNS} FROM pm_tracker_task WHERE user_id = $1 AND client_id = $2`,
      [userId, del.id],
    );

    if (current[0]) {
      // Changed since the client last saw it: keep the newer copy rather than delete it.
      result.conflicts.push({
        kind: 'delete',
        id: del.id,
        data: rowToTask(current[0]),
        revision: Number(current[0].revision),
      });

      return;
    }
    // Already gone (deleted elsewhere): the client's intent holds, fall through.
  }

  const tomb = await queryRows<{ revision: string }>(
    manager,
    `INSERT INTO pm_tracker_tombstone (user_id, record_id, revision)
     VALUES ($1, $2, nextval('${REVISION_SEQUENCE}'))
     ON CONFLICT (user_id, record_id) DO UPDATE SET revision = EXCLUDED.revision, updated_at = now()
     RETURNING revision`,
    [userId, del.id],
  );

  result.applied.push({
    kind: 'delete',
    id: del.id,
    revision: Number(tomb[0]!.revision),
  });
}

/*
 * Applies one save from the client (ADR-0018). Each write is a compare-and-set on the
 * record's revision: it lands only if the record is still at the revision the client
 * started from. Anything else comes back as a conflict carrying the server's current
 * copy, for the client to merge and send again -- a stale tab can no longer overwrite
 * newer data. Records are independent, so the writes that do match are kept.
 */
@Injectable()
@CommandHandler(CommitRecordsCommand)
export class CommitRecordsHandler
  implements ICommandHandler<CommitRecordsCommand>
{
  constructor(
    @InjectRepository(PmTrackerStateEntity)
    private readonly stateRepo: Repository<PmTrackerStateEntity>,
  ) {}

  async execute(
    command: CommitRecordsCommand,
  ): Promise<PmTrackerCommitResultDto> {
    const outcome = await this.stateRepo.manager.transaction(
      async (manager) => {
        await lockUser(manager, command.userId);
        const result: IOutcome = { applied: [], conflicts: [], rejected: [] };

        for (const write of command.dto.docs ?? []) {
          // eslint-disable-next-line no-await-in-loop -- writes run in order inside one transaction
          await writeDoc(manager, command.userId, write, result);
        }

        for (const write of command.dto.tasks ?? []) {
          // eslint-disable-next-line no-await-in-loop -- writes run in order inside one transaction
          await writeTask(manager, command.userId, write, result);
        }

        for (const del of command.dto.deletes ?? []) {
          // eslint-disable-next-line no-await-in-loop -- writes run in order inside one transaction
          await deleteTask(manager, command.userId, del, result);
        }

        return result;
      },
    );

    return PmTrackerCommitResultDto.create(outcome);
  }
}
