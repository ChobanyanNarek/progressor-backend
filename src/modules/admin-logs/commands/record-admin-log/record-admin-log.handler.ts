import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity.js';
import { Propagation, Transactional } from 'typeorm-transactional';

import { AdminLogEntryEntity } from '../../admin-log-entry.entity.ts';
import { RecordAdminLogCommand } from './record-admin-log.command.ts';

@CommandHandler(RecordAdminLogCommand)
export class RecordAdminLogHandler
  implements ICommandHandler<RecordAdminLogCommand, void>
{
  constructor(
    @InjectRepository(AdminLogEntryEntity)
    private readonly adminLogEntryRepository: Repository<AdminLogEntryEntity>,
  ) {}

  /*
   * REQUIRES_NEW: the log write runs in its own transaction, so a diagnostic
   * entry (e.g. a `did` failure or a DB-error log) still commits even when the
   * caller's surrounding transaction rolls back. Persistence errors are NOT
   * swallowed here — they propagate so the fire-and-forget `.catch` in
   * AdminLogsService.record() reports them without affecting the caller.
   */
  @Transactional({ propagation: Propagation.REQUIRES_NEW })
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

    await this.adminLogEntryRepository.insert(values);
  }
}
