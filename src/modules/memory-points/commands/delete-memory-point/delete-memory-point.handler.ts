import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { MemoryPointEntity } from '../../entities/memory-point.entity.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { DeleteMemoryPointCommand } from './delete-memory-point.command.ts';

@CommandHandler(DeleteMemoryPointCommand)
export class DeleteMemoryPointHandler
  implements ICommandHandler<DeleteMemoryPointCommand, void>
{
  constructor(
    @InjectRepository(MemoryPointEntity)
    private readonly memoryPointRepository: Repository<MemoryPointEntity>,
  ) {}

  async execute(command: DeleteMemoryPointCommand): Promise<void> {
    const { memoryPointId } = command;

    const result = await this.memoryPointRepository.delete({
      id: memoryPointId,
    });

    if (result.affected === 0) {
      throw new MemoryPointNotFoundException();
    }
  }
}
