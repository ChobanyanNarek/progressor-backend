import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { MemoryPointEntity } from '../../entities/memory-point.entity.ts';
import { MarkGenerationStartedCommand } from './mark-generation-started.command.ts';

@CommandHandler(MarkGenerationStartedCommand)
export class MarkGenerationStartedHandler
  implements ICommandHandler<MarkGenerationStartedCommand, void>
{
  constructor(
    @InjectRepository(MemoryPointEntity)
    private readonly memoryPointRepository: Repository<MemoryPointEntity>,
  ) {}

  async execute(command: MarkGenerationStartedCommand): Promise<void> {
    const { memoryPointId } = command;

    await this.memoryPointRepository.update(
      { id: memoryPointId },
      { status: MemoryPointStatus.GENERATING },
    );
  }
}
