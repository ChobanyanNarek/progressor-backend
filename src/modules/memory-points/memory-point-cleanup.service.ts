import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Cron, CronExpression } from '@nestjs/schedule';

import { CleanupStaleDraftsCommand } from './commands/cleanup-stale-drafts/cleanup-stale-drafts.command.ts';

/**
 * Periodically removes abandoned memory point drafts (PENDING points whose
 * details were never submitted). The age threshold is configured via
 * `MEMORY_POINT_DRAFT_TTL`; this only controls how often the sweep runs.
 */
@Injectable()
export class MemoryPointCleanupService {
  private readonly logger = new Logger(MemoryPointCleanupService.name);

  constructor(private readonly commandBus: CommandBus) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupStaleDrafts(): Promise<void> {
    try {
      await this.commandBus.execute<CleanupStaleDraftsCommand, number>(
        new CleanupStaleDraftsCommand(),
      );
    } catch (error) {
      this.logger.error(
        'Stale draft cleanup run failed',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
