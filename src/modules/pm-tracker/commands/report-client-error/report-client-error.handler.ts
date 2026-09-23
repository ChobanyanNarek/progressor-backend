import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { LogLevel } from '../../../../constants/log-level.ts';
import { LogSource } from '../../../../constants/log-source.ts';
import { AdminLogsService } from '../../../admin-logs/admin-logs.service.ts';
import { ReportClientErrorCommand } from './report-client-error.command.ts';

/**
 * Records an error from a user's browser in the admin log, where the admin panel can list
 * it. Built in rather than sent to a third-party tracker. Fire-and-forget, like every
 * admin-log write: reporting a failure must never itself fail the caller.
 */
@Injectable()
@CommandHandler(ReportClientErrorCommand)
export class ReportClientErrorHandler
  implements ICommandHandler<ReportClientErrorCommand>
{
  constructor(private readonly adminLogsService: AdminLogsService) {}

  execute(command: ReportClientErrorCommand): Promise<void> {
    const { report, userId, userAgent } = command;

    this.adminLogsService.record({
      level: LogLevel.ERROR,
      source: LogSource.WEB,
      message: report.message,
      context: {
        userId,
        kind: report.kind ?? 'error',
        url: report.url ?? null,
        release: report.release ?? null,
        stack: report.stack ?? null,
        userAgent: userAgent ?? null,
      },
    });

    return Promise.resolve();
  }
}
