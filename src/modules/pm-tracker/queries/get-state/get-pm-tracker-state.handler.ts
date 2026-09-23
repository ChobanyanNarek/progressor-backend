import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import type { PmTrackerRecordsDto } from '../../dtos/pm-tracker-records.dto.ts';
import { PmTrackerStateEntity } from '../../pm-tracker-state.entity.ts';
import { GetRecordsQuery } from '../get-records/get-records.query.ts';
import { GetPmTrackerStateQuery } from './get-pm-tracker-state.query.ts';

@Injectable()
@QueryHandler(GetPmTrackerStateQuery)
export class GetPmTrackerStateHandler
  implements IQueryHandler<GetPmTrackerStateQuery>
{
  constructor(
    @InjectRepository(PmTrackerStateEntity)
    private readonly repo: Repository<PmTrackerStateEntity>,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(
    query: GetPmTrackerStateQuery,
  ): Promise<PmTrackerStateEntity | null> {
    const userState = await this.repo
      .createQueryBuilder('s')
      .where('s.user_id = :userId', { userId: query.userId })
      .getOne();

    /*
     * Migrated to per-record storage (ADR-0018): the blob is a frozen backup, so answer
     * with the current records assembled into the old shape. Only an old open tab still
     * asks for this; the blob itself is left as it is.
     */
    if (userState?.migratedAt) {
      const records = await this.queryBus.execute<
        GetRecordsQuery,
        PmTrackerRecordsDto
      >(new GetRecordsQuery(query.userId));
      const data: Record<string, unknown> = { _v: 3 };

      for (const doc of records.docs) {
        data[doc.key] = doc.data;
      }

      data.tasks = records.tasks.map((t) => t.data);
      userState.data = data;

      return userState;
    }

    if (userState) {
      return userState;
    }

    // Migrate the legacy 'default' workspace to this user on first access.
    const defaultState = await this.repo
      .createQueryBuilder('s')
      .where('s.workspace_key = :key AND s.user_id IS NULL', { key: 'default' })
      .getOne();

    if (defaultState) {
      await this.repo
        .createQueryBuilder()
        .update(PmTrackerStateEntity)
        .set({ userId: query.userId } as never)
        .where('id = :id', { id: defaultState.id })
        .execute();

      defaultState.userId = query.userId;

      return defaultState;
    }

    return null;
  }
}
