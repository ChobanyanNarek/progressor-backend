import { Logger } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity.js';

import { AdminLogEntryEntity } from '../../admin-log-entry.entity.ts';
import { RecordAdminLogCommand } from './record-admin-log.command.ts';

@CommandHandler(RecordAdminLogCommand)
export class RecordAdminLogHandler
  implements ICommandHandler<RecordAdminLogCommand, void>
{
  private readonly logger = new Logger(RecordAdminLogHandler.name);

  constructor(
    @InjectRepository(AdminLogEntryEntity)
    private readonly logRepository: Repository<AdminLogEntryEntity>,
  ) {}

  async execute(command: RecordAdminLogCommand): Promise<void> {
    const { input } = command;

    /*
     * Straight `insert` (one round-trip, no SELECT). The payload is typed as
     * `QueryDeepPartialEntity` because TypeORM maps the free-form `jsonb`
     * `context` column to a value-OR-SQL-function union that a plain
     * `Record<string, unknown>` does not structurally satisfy; the runtime
     * shape is correct.
     */
    const values: QueryDeepPartialEntity<AdminLogEntryEntity> = {
      timestamp: input.timestamp ?? new Date(),
      level: input.level,
      source: input.source,
      message: input.message,
      memoryPointId: input.memoryPointId ?? null,
      context: (input.context ??
        null) as QueryDeepPartialEntity<AdminLogEntryEntity>['context'],
    };

    try {
      await this.logRepository.insert(values);
    } catch (error: unknown) {
      /*
       * Logging must never break the caller's flow: swallow any persistence
       * failure and report it through the Nest logger.
       */
      this.logger.error(
        'Failed to persist admin log entry',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
