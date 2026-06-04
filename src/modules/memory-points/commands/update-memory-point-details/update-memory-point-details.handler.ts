import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { MemoryPointDetailsEntity } from '../../entities/memory-point-details.entity.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { UpdateMemoryPointDetailsCommand } from './update-memory-point-details.command.ts';

@CommandHandler(UpdateMemoryPointDetailsCommand)
export class UpdateMemoryPointDetailsHandler
  implements ICommandHandler<UpdateMemoryPointDetailsCommand, void>
{
  constructor(
    @InjectRepository(MemoryPointDetailsEntity)
    private readonly detailsRepository: Repository<MemoryPointDetailsEntity>,
  ) {}

  async execute(command: UpdateMemoryPointDetailsCommand): Promise<void> {
    const { memoryPointId, dto } = command;

    const updatePayload: Partial<MemoryPointDetailsEntity> = {};

    if (dto.title !== undefined) {
      updatePayload.title = dto.title;
    }

    if (dto.description !== undefined) {
      updatePayload.description = dto.description;
    }

    if (dto.cloudAnchorId !== undefined) {
      updatePayload.cloudAnchorId = dto.cloudAnchorId;
    }

    if (dto.type !== undefined) {
      updatePayload.type = dto.type;
    }

    const result = await this.detailsRepository
      .createQueryBuilder()
      .update()
      .set(updatePayload)
      .where('memory_point_id = :memoryPointId', { memoryPointId })
      .execute();

    if (result.affected === 0) {
      throw new MemoryPointNotFoundException();
    }
  }
}
