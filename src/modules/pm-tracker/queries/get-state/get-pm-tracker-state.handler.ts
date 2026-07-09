import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PmTrackerStateEntity } from '../../pm-tracker-state.entity.ts';
import { GetPmTrackerStateQuery } from './get-pm-tracker-state.query.ts';

@Injectable()
@QueryHandler(GetPmTrackerStateQuery)
export class GetPmTrackerStateHandler
  implements IQueryHandler<GetPmTrackerStateQuery>
{
  constructor(
    @InjectRepository(PmTrackerStateEntity)
    private readonly repo: Repository<PmTrackerStateEntity>,
  ) {}

  async execute(
    query: GetPmTrackerStateQuery,
  ): Promise<PmTrackerStateEntity | null> {
    const userState = await this.repo
      .createQueryBuilder('s')
      .where('s.user_id = :userId', { userId: query.userId })
      .getOne();

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
