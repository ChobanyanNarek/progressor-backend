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
    const result = await this.repo
      .createQueryBuilder('s')
      .where('s.workspace_key = :key', { key: query.workspaceKey })
      .getOne();

    return result;
  }
}
