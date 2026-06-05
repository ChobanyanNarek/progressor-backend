import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { MemoryPointDetailsEntity } from '../../entities/memory-point-details.entity.ts';
import { ApplyGenerationResultCommand } from './apply-generation-result.command.ts';

@CommandHandler(ApplyGenerationResultCommand)
export class ApplyGenerationResultHandler
  implements ICommandHandler<ApplyGenerationResultCommand, void>
{
  constructor(
    @InjectRepository(MemoryPointDetailsEntity)
    private readonly detailsRepository: Repository<MemoryPointDetailsEntity>,
  ) {}

  async execute(command: ApplyGenerationResultCommand): Promise<void> {
    const { memoryPointId, payload } = command;

    if (payload.videoUrl !== undefined) {
      await this.detailsRepository.update(
        { memoryPointId },
        { videoUrl: payload.videoUrl },
      );
    }
  }
}
