import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { PublicationState } from '../../../../constants/publication-state.ts';
import { MemoryPointEntity } from '../../entities/memory-point.entity.ts';
import { InvalidPublicationStateTransitionException } from '../../exceptions/invalid-publication-state-transition.exception.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { UpdatePublicationStateCommand } from './update-publication-state.command.ts';

/*
 * Allowed publication-axis transitions (admin-facing):
 * ACTIVE   → INACTIVE  (temporarily hide)
 * ACTIVE   → ARCHIVED  (soft-archive; terminal by default)
 * INACTIVE → ACTIVE    (re-activate)
 * INACTIVE → ARCHIVED  (archive from hidden state)
 * ARCHIVED → ACTIVE    (admin can reactivate an archived point)
 * ARCHIVED → INACTIVE  (admin can move archived point back to hidden)
 *
 * ARCHIVED is NOT fully terminal for admin — an admin can explicitly reactivate
 * to INACTIVE or ACTIVE. This allows recovering from mistakes.
 */
const ALLOWED_PUBLICATION_TRANSITIONS: Readonly<
  Record<PublicationState, ReadonlySet<PublicationState>>
> = {
  [PublicationState.ACTIVE]: new Set([
    PublicationState.INACTIVE,
    PublicationState.ARCHIVED,
  ]),
  [PublicationState.INACTIVE]: new Set([
    PublicationState.ACTIVE,
    PublicationState.ARCHIVED,
  ]),
  // Admin can reactivate archived points to recover from mistakes.
  [PublicationState.ARCHIVED]: new Set([
    PublicationState.ACTIVE,
    PublicationState.INACTIVE,
  ]),
};

@CommandHandler(UpdatePublicationStateCommand)
export class UpdatePublicationStateHandler
  implements ICommandHandler<UpdatePublicationStateCommand, void>
{
  constructor(
    @InjectRepository(MemoryPointEntity)
    private readonly memoryPointRepository: Repository<MemoryPointEntity>,
  ) {}

  async execute(command: UpdatePublicationStateCommand): Promise<void> {
    const { memoryPointId, publicationState } = command;

    const point = await this.memoryPointRepository
      .createQueryBuilder('mp')
      .select(['mp.id', 'mp.publicationState'])
      .where('mp.id = :id', { id: memoryPointId })
      .getOne();

    if (!point) {
      throw new MemoryPointNotFoundException();
    }

    if (
      !ALLOWED_PUBLICATION_TRANSITIONS[point.publicationState].has(
        publicationState,
      )
    ) {
      throw new InvalidPublicationStateTransitionException();
    }

    await this.memoryPointRepository
      .createQueryBuilder()
      .update()
      .set({ publicationState })
      .where('id = :id', { id: memoryPointId })
      .execute();
  }
}
