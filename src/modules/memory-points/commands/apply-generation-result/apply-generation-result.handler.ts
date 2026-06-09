import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { AiGenerationStatus } from '../../../../constants/ai-generation-status.ts';
import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { MemoryPointEntity } from '../../entities/memory-point.entity.ts';
import { MemoryPointDetailsEntity } from '../../entities/memory-point-details.entity.ts';
import { ApplyGenerationResultCommand } from './apply-generation-result.command.ts';

/**
 * Maps a terminal generation outcome to the memory point's review status.
 * COMPLETED hands the result to AI review; FAILED returns the point to the
 * admin so it can be retried. Non-terminal statuses leave the point untouched.
 */
const GENERATION_STATUS_TO_MEMORY_POINT_STATUS: Partial<
  Record<AiGenerationStatus, MemoryPointStatus>
> = {
  [AiGenerationStatus.COMPLETED]: MemoryPointStatus.AI_REVIEWING,
  [AiGenerationStatus.FAILED]: MemoryPointStatus.ADMIN_REVIEWING,
};

@CommandHandler(ApplyGenerationResultCommand)
export class ApplyGenerationResultHandler
  implements ICommandHandler<ApplyGenerationResultCommand, void>
{
  constructor(
    @InjectRepository(MemoryPointDetailsEntity)
    private readonly detailsRepository: Repository<MemoryPointDetailsEntity>,
    @InjectRepository(MemoryPointEntity)
    private readonly memoryPointRepository: Repository<MemoryPointEntity>,
  ) {}

  async execute(command: ApplyGenerationResultCommand): Promise<void> {
    const { memoryPointId, payload } = command;

    if (payload.videoUrl !== undefined) {
      await this.detailsRepository.update(
        { memoryPointId },
        { videoUrl: payload.videoUrl },
      );
    }

    const nextStatus = GENERATION_STATUS_TO_MEMORY_POINT_STATUS[payload.status];

    if (nextStatus !== undefined) {
      await this.memoryPointRepository.update(
        { id: memoryPointId },
        { status: nextStatus },
      );
    }
  }
}
