import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import type { PageDto } from '../../common/dto/page.dto.ts';
import { RecordAdminLogCommand } from './commands/record-admin-log/record-admin-log.command.ts';
import type { AdminLogEntryDto } from './dtos/admin-log-entry.dto.ts';
import type { AdminLogOptionsDto } from './dtos/admin-log-options.dto.ts';
import type { IAdminLogInput } from './interfaces/i-admin-log-input.ts';
import { GetAdminLogsQuery } from './queries/get-admin-logs/get-admin-logs.query.ts';

@Injectable()
export class AdminLogsService {
  private readonly logger = new Logger(AdminLogsService.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  getLogs(optionsDto: AdminLogOptionsDto): Promise<PageDto<AdminLogEntryDto>> {
    return this.queryBus.execute<GetAdminLogsQuery, PageDto<AdminLogEntryDto>>(
      new GetAdminLogsQuery(optionsDto),
    );
  }

  /**
   * Fire-and-forget log producer. Callers (did/api) emit a structured entry
   * without awaiting persistence — this MUST NOT throw or block: a logging
   * failure must never break the caller's flow. The write is dispatched as a
   * CQRS command (ADR-0007) and runs detached; the handler swallows persistence
   * errors, and the extra `.catch` guards against a dispatch-time rejection.
   */
  record(input: IAdminLogInput): void {
    void this.commandBus
      .execute(new RecordAdminLogCommand(input))
      .catch((error: unknown) => {
        this.logger.error(
          'Failed to dispatch admin log command',
          error instanceof Error ? error.stack : String(error),
        );
      });
  }
}
