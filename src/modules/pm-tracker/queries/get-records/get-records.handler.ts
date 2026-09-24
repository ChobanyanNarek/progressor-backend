import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PmTrackerStateEntity } from '../../pm-tracker-state.entity.ts';
import { loadRecordRows } from '../../records/load-records.ts';
import { rowToTask } from '../../records/record-mapping.ts';
import type { RecordsResponse } from '../../sync-core/records-types.ts';
import { GetRecordsQuery } from './get-records.query.ts';

/*
 * A user's records as plain objects. Deliberately not a DTO: running megabytes of task
 * data through class-transformer blocked the event loop for seconds and several times the
 * data's size in memory, which failed Render's health checks.
 */
@Injectable()
@QueryHandler(GetRecordsQuery)
export class GetRecordsHandler implements IQueryHandler<GetRecordsQuery> {
  constructor(
    @InjectRepository(PmTrackerStateEntity)
    private readonly stateRepo: Repository<PmTrackerStateEntity>,
  ) {}

  async execute(query: GetRecordsQuery): Promise<RecordsResponse> {
    const rows = await loadRecordRows<unknown>(
      this.stateRepo.manager,
      query.userId,
      query.since,
      false,
    );

    return {
      full: rows.isFull,
      cursor: rows.cursor,
      docs: rows.docs.map((d) => ({
        key: d.key,
        data: d.data,
        revision: Number(d.revision),
      })),
      tasks: rows.tasks.map((t) => ({
        id: t.clientId,
        data: rowToTask({
          ...t,
          jiras: t.jiras as unknown[],
          rest: t.rest as Record<string, unknown>,
        }),
        revision: Number(t.revision),
      })),
      deleted: rows.deleted.map((d) => ({
        id: d.recordId,
        revision: Number(d.revision),
      })),
    };
  }
}
