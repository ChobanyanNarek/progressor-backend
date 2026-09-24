import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PmTrackerStateEntity } from '../../pm-tracker-state.entity.ts';
import { loadRecordRows, recordsJson } from '../../records/load-records.ts';
import { GetRecordsJsonQuery } from './get-records-json.query.ts';

/*
 * The web app's load, written straight from Postgres's JSON text: no parse, no
 * class-transformer, no re-serialisation of the user's task data (see GetRecordsHandler).
 */
@Injectable()
@QueryHandler(GetRecordsJsonQuery)
export class GetRecordsJsonHandler
  implements IQueryHandler<GetRecordsJsonQuery>
{
  constructor(
    @InjectRepository(PmTrackerStateEntity)
    private readonly stateRepo: Repository<PmTrackerStateEntity>,
  ) {}

  async execute(query: GetRecordsJsonQuery): Promise<string> {
    return recordsJson(
      await loadRecordRows<string>(
        this.stateRepo.manager,
        query.userId,
        query.since,
        true,
      ),
    );
  }
}
