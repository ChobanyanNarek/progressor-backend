import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PmTrackerRecordsDto } from '../../dtos/pm-tracker-records.dto.ts';
import { PmTrackerStateEntity } from '../../pm-tracker-state.entity.ts';
import {
  type IStoredTaskRow,
  queryRows,
  rowToTask,
  TASK_COLUMNS,
} from '../../records/record-mapping.ts';
import { GetRecordsQuery } from './get-records.query.ts';

/*
 * A user's records: everything (since undefined), or only what changed after a revision.
 * One read-only transaction, so the three reads see the same moment and the cursor
 * covers exactly what was returned.
 */
@Injectable()
@QueryHandler(GetRecordsQuery)
export class GetRecordsHandler implements IQueryHandler<GetRecordsQuery> {
  constructor(
    @InjectRepository(PmTrackerStateEntity)
    private readonly stateRepo: Repository<PmTrackerStateEntity>,
  ) {}

  async execute(query: GetRecordsQuery): Promise<PmTrackerRecordsDto> {
    const isFull = query.since === undefined;
    const since = query.since ?? -1;

    const records = await this.stateRepo.manager.transaction(
      'REPEATABLE READ',
      async (manager) => {
        // One connection runs these in turn; Promise.all only saves the round-trip waits.
        const [docs, tasks, deleted, top] = await Promise.all([
          queryRows<{ key: string; data: unknown; revision: string }>(
            manager,
            `SELECT key, data, revision FROM pm_tracker_doc WHERE user_id = $1 AND revision > $2 ORDER BY key`,
            [query.userId, since],
          ),
          queryRows<IStoredTaskRow>(
            manager,
            `SELECT ${TASK_COLUMNS}
             FROM pm_tracker_task WHERE user_id = $1 AND revision > $2 ORDER BY date, created_at`,
            [query.userId, since],
          ),
          isFull
            ? Promise.resolve([])
            : queryRows<{ recordId: string; revision: string }>(
                manager,
                `SELECT record_id AS "recordId", revision FROM pm_tracker_tombstone WHERE user_id = $1 AND revision > $2`,
                [query.userId, since],
              ),
          /*
           * The cursor is the user's highest revision anywhere, not just among what was
           * returned: a full snapshot with no rows still needs a cursor to continue from.
           */
          queryRows<{ cursor: string | null }>(
            manager,
            `SELECT GREATEST(
               (SELECT max(revision) FROM pm_tracker_doc WHERE user_id = $1),
               (SELECT max(revision) FROM pm_tracker_task WHERE user_id = $1),
               (SELECT max(revision) FROM pm_tracker_tombstone WHERE user_id = $1)
             ) AS cursor`,
            [query.userId],
          ),
        ]);

        return { docs, tasks, deleted, cursor: top[0]?.cursor ?? null };
      },
    );

    return PmTrackerRecordsDto.create({
      full: isFull,
      cursor: Math.max(Number(records.cursor ?? 0), isFull ? 0 : since),
      docs: records.docs.map((d) => ({
        key: d.key,
        data: d.data,
        revision: Number(d.revision),
      })),
      tasks: records.tasks.map((t) => ({
        id: t.clientId,
        data: rowToTask(t),
        revision: Number(t.revision),
      })),
      deleted: records.deleted.map((d) => ({
        id: d.recordId,
        revision: Number(d.revision),
      })),
    });
  }
}
