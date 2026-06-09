import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity.js';

import type { PageDto } from '../../common/dto/page.dto.ts';
import { AdminLogEntryEntity } from './admin-log-entry.entity.ts';
import type { AdminLogEntryDto } from './dtos/admin-log-entry.dto.ts';
import type { AdminLogOptionsDto } from './dtos/admin-log-options.dto.ts';
import type { IAdminLogInput } from './interfaces/i-admin-log-input.ts';
import { GetAdminLogsQuery } from './queries/get-admin-logs/get-admin-logs.query.ts';

@Injectable()
export class AdminLogsService {
  private readonly logger = new Logger(AdminLogsService.name);

  constructor(
    @InjectRepository(AdminLogEntryEntity)
    private readonly logRepository: Repository<AdminLogEntryEntity>,
    private readonly queryBus: QueryBus,
  ) {}

  getLogs(optionsDto: AdminLogOptionsDto): Promise<PageDto<AdminLogEntryDto>> {
    return this.queryBus.execute<GetAdminLogsQuery, PageDto<AdminLogEntryDto>>(
      new GetAdminLogsQuery(optionsDto),
    );
  }

  /**
   * Fire-and-forget log producer. Callers (did/auth/api) emit a structured
   * entry without awaiting persistence — this MUST NOT throw or block: a
   * logging failure must never break the caller's flow. The insert runs
   * detached; any rejection is swallowed and reported via the Nest logger.
   */
  record(input: IAdminLogInput): void {
    /*
     * Straight `insert` (one round-trip, no SELECT). The payload is typed as
     * `QueryDeepPartialEntity` because TypeORM maps the free-form `jsonb`
     * `context` column to a value-OR-SQL-function union that our plain
     * `Record<string, unknown>` does not structurally satisfy; the runtime
     * shape is correct.
     */
    const values: QueryDeepPartialEntity<AdminLogEntryEntity> = {
      timestamp: input.timestamp ?? new Date(),
      level: input.level,
      source: input.source,
      message: input.message,
      memoryPointId: input.memoryPointId ?? null,
      /*
       * jsonb column: TypeORM's deep-partial union (value | SQL fn) rejects a
       * plain object literal here, so the value is narrowed to the column type.
       */
      context: (input.context ??
        null) as QueryDeepPartialEntity<AdminLogEntryEntity>['context'],
    };

    void this.logRepository.insert(values).catch((error: unknown) => {
      this.logger.error(
        'Failed to persist admin log entry',
        error instanceof Error ? error.stack : String(error),
      );
    });
  }
}
