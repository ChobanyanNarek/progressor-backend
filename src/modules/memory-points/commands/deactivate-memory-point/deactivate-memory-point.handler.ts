import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { PublicationState } from '../../../../constants/publication-state.ts';
import { MemoryPointEntity } from '../../entities/memory-point.entity.ts';
import { InvalidPublicationStateTransitionException } from '../../exceptions/invalid-publication-state-transition.exception.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { MemoryPointNotOwnedException } from '../../exceptions/memory-point-not-owned.exception.ts';
import { DeactivateMemoryPointCommand } from './deactivate-memory-point.command.ts';

@CommandHandler(DeactivateMemoryPointCommand)
export class DeactivateMemoryPointHandler
  implements ICommandHandler<DeactivateMemoryPointCommand, void>
{
  constructor(
    @InjectRepository(MemoryPointEntity)
    private readonly memoryPointRepository: Repository<MemoryPointEntity>,
  ) {}

  async execute(command: DeactivateMemoryPointCommand): Promise<void> {
    const { memoryPointId, userId } = command;

    const point = await this.memoryPointRepository
      .createQueryBuilder('mp')
      .select(['mp.id', 'mp.userId', 'mp.publicationState'])
      .where('mp.id = :id', { id: memoryPointId })
      .getOne();

    if (!point) {
      throw new MemoryPointNotFoundException();
    }

    if (point.userId !== userId) {
      throw new MemoryPointNotOwnedException();
    }

    /*
     * Creators can only deactivate ACTIVE points; INACTIVE is a no-op they
     * should not call twice; ARCHIVED is admin-only territory.
     */
    if (point.publicationState !== PublicationState.ACTIVE) {
      throw new InvalidPublicationStateTransitionException();
    }

    await this.memoryPointRepository
      .createQueryBuilder()
      .update()
      .set({ publicationState: PublicationState.INACTIVE })
      .where('id = :id', { id: memoryPointId })
      .execute();
  }
}
