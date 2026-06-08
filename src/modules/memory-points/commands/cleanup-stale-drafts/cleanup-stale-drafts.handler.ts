import { Logger } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { ApiConfigService } from '../../../../shared/services/api-config.service.ts';
import { GcsStorageService } from '../../../../shared/services/gcs-storage.service.ts';
import { MemoryPointEntity } from '../../entities/memory-point.entity.ts';
import { CleanupStaleDraftsCommand } from './cleanup-stale-drafts.command.ts';

@CommandHandler(CleanupStaleDraftsCommand)
export class CleanupStaleDraftsHandler
  implements ICommandHandler<CleanupStaleDraftsCommand, number>
{
  private readonly logger = new Logger(CleanupStaleDraftsHandler.name);

  constructor(
    @InjectRepository(MemoryPointEntity)
    private readonly memoryPointRepository: Repository<MemoryPointEntity>,
    private readonly gcsStorageService: GcsStorageService,
    private readonly apiConfigService: ApiConfigService,
  ) {}

  async execute(): Promise<number> {
    const threshold = new Date(
      Date.now() - this.apiConfigService.memoryPointDraftTtl,
    );

    // A draft = PENDING point with no details row, created before the threshold.
    const staleDrafts = await this.memoryPointRepository
      .createQueryBuilder('mp')
      .leftJoin('mp.memoryPointDetails', 'details')
      .where('mp.status = :status', { status: MemoryPointStatus.PENDING })
      .andWhere('details.id IS NULL')
      .andWhere('mp.createdAt < :threshold', { threshold })
      .getMany();

    if (staleDrafts.length === 0) {
      return 0;
    }

    /*
     * Purge each draft's GCS media prefix first. Tolerate per-draft failures so
     * one bad object does not block the whole batch; only drafts whose media was
     * cleared get their row removed, the rest are retried on the next run.
     */
    const purgedIds: Uuid[] = [];

    await Promise.all(
      staleDrafts.map(async (draft) => {
        try {
          await this.gcsStorageService.deletePrefix(
            `memory-points/${draft.id}/`,
          );
          purgedIds.push(draft.id);
        } catch (error) {
          this.logger.error(
            `Failed to purge media for stale draft ${draft.id}`,
            error instanceof Error ? error.stack : String(error),
          );
        }
      }),
    );

    if (purgedIds.length > 0) {
      await this.memoryPointRepository.delete(purgedIds);
    }

    this.logger.log(`Purged ${purgedIds.length} stale memory point draft(s)`);

    return purgedIds.length;
  }
}
