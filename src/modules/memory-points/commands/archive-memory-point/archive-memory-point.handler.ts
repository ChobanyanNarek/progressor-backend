import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { PublicationState } from '../../../../constants/publication-state.ts';
import { MemoryPointEntity } from '../../entities/memory-point.entity.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { ArchiveMemoryPointCommand } from './archive-memory-point.command.ts';

@CommandHandler(ArchiveMemoryPointCommand)
export class ArchiveMemoryPointHandler
  implements ICommandHandler<ArchiveMemoryPointCommand, void>
{
  constructor(
    @InjectRepository(MemoryPointEntity)
    private readonly memoryPointRepository: Repository<MemoryPointEntity>,
  ) {}

  async execute(command: ArchiveMemoryPointCommand): Promise<void> {
    const { memoryPointId } = command;

    /*
     * Set publicationState = ARCHIVED before soft-deleting so the record is
     * coherent even if inspected with .withDeleted(). The order matters: update
     * first, then soft-delete so the deletedAt timestamp is set last.
     */
    const updateResult = await this.memoryPointRepository
      .createQueryBuilder()
      .update()
      .set({ publicationState: PublicationState.ARCHIVED })
      .where('id = :id', { id: memoryPointId })
      .execute();

    if (updateResult.affected === 0) {
      throw new MemoryPointNotFoundException();
    }

    /*
     * softDelete is explicitly allowed per the ticket spec — it stamps deletedAt
     * without physically removing the row; TypeORM then auto-excludes soft-deleted
     * rows from all query-builder reads unless .withDeleted() is added.
     */
    await this.memoryPointRepository.softDelete({ id: memoryPointId });
  }
}
