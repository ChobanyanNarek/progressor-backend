import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { MemoryPointEntity } from '../../entities/memory-point.entity.ts';
import { MemoryPointNotEditableException } from '../../exceptions/memory-point-not-editable.exception.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { UpdateMemoryPointLocationCommand } from './update-memory-point-location.command.ts';

@CommandHandler(UpdateMemoryPointLocationCommand)
export class UpdateMemoryPointLocationHandler
  implements ICommandHandler<UpdateMemoryPointLocationCommand, void>
{
  constructor(
    @InjectRepository(MemoryPointEntity)
    private readonly memoryPointRepository: Repository<MemoryPointEntity>,
  ) {}

  async execute(command: UpdateMemoryPointLocationCommand): Promise<void> {
    const {
      memoryPointId,
      latitude,
      longitude,
      shouldSkipOwnershipCheck,
      userId,
    } = command;

    /*
     * Creator path: validate ownership and editability before applying the
     * coordinate update. Mirrors the guard in upsert-memory-point-details.handler.ts
     * (L48-54) — must own the point AND it must still be in PENDING state.
     * Admin path: skips both checks so any point (any status) can be repositioned.
     */
    if (!shouldSkipOwnershipCheck) {
      const point = await this.memoryPointRepository
        .createQueryBuilder('mp')
        .select(['mp.id', 'mp.userId', 'mp.status'])
        .where('mp.id = :id', { id: memoryPointId })
        .getOne();

      if (!point || point.userId !== userId) {
        throw new MemoryPointNotFoundException();
      }

      if (point.status !== MemoryPointStatus.PENDING) {
        throw new MemoryPointNotEditableException();
      }
    }

    const result = await this.memoryPointRepository
      .createQueryBuilder()
      .update()
      .set({
        location: () => `ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)`,
      })
      .where('id = :id', { id: memoryPointId })
      .setParameters({ longitude, latitude })
      .execute();

    if (result.affected === 0) {
      throw new MemoryPointNotFoundException();
    }
  }
}
