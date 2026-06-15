import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { ADMIN_EDITABLE_STATUSES } from '../../../../constants/memory-point-status.ts';
import { MemoryPointEntity } from '../../entities/memory-point.entity.ts';
import { MemoryPointDetailsEntity } from '../../entities/memory-point-details.entity.ts';
import { MemoryPointNotEditableException } from '../../exceptions/memory-point-not-editable.exception.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { UpdateMemoryPointDetailsCommand } from './update-memory-point-details.command.ts';

@CommandHandler(UpdateMemoryPointDetailsCommand)
export class UpdateMemoryPointDetailsHandler
  implements ICommandHandler<UpdateMemoryPointDetailsCommand, void>
{
  constructor(
    @InjectRepository(MemoryPointEntity)
    private readonly memoryPointRepository: Repository<MemoryPointEntity>,
    @InjectRepository(MemoryPointDetailsEntity)
    private readonly detailsRepository: Repository<MemoryPointDetailsEntity>,
  ) {}

  /**
   * Admin edit of a point's texts and/or source media. Editing is only allowed
   * before (re)generation (`ADMIN_REVIEWING`/`REJECTED`); other statuses 403.
   *
   * A point that has no details row yet has nothing for the admin to edit before
   * the creator submits, so this stays an UPSERT for safety: when the row is
   * absent we INSERT a metadata-only details row. A bogus memory point id 404s.
   */
  async execute(command: UpdateMemoryPointDetailsCommand): Promise<void> {
    const { memoryPointId, dto } = command;

    const memoryPoint = await this.memoryPointRepository
      .createQueryBuilder('mp')
      .where('mp.id = :id', { id: memoryPointId })
      .getOne();

    if (!memoryPoint) {
      throw new MemoryPointNotFoundException();
    }

    if (!ADMIN_EDITABLE_STATUSES.includes(memoryPoint.status)) {
      throw new MemoryPointNotEditableException();
    }

    const metadata: Partial<MemoryPointDetailsEntity> = {};

    if (dto.title !== undefined) {
      metadata.title = dto.title;
    }

    if (dto.description !== undefined) {
      metadata.description = dto.description;
    }

    if (dto.cloudAnchorId !== undefined) {
      metadata.cloudAnchorId = dto.cloudAnchorId;
    }

    if (dto.type !== undefined) {
      metadata.type = dto.type;
    }

    if (dto.sourcePhotoUrl !== undefined) {
      metadata.sourcePhotoUrl = dto.sourcePhotoUrl;
    }

    if (dto.sourceAudioUrl !== undefined) {
      metadata.sourceAudioUrl = dto.sourceAudioUrl;
    }

    const existingDetails = await this.detailsRepository
      .createQueryBuilder('details')
      .where('details.memoryPointId = :memoryPointId', { memoryPointId })
      .getOne();

    if (existingDetails) {
      // Nothing to change — avoid TypeORM's "update values are not defined".
      if (Object.keys(metadata).length === 0) {
        return;
      }

      await this.detailsRepository
        .createQueryBuilder()
        .update()
        .set(metadata)
        .where('memory_point_id = :memoryPointId', { memoryPointId })
        .execute();

      return;
    }

    /*
     * No details row yet (fresh PENDING point). Insert a metadata-only row with
     * NULL sources; the creator's upload flow fills the sources later. `type` is
     * a NOT NULL enum, so the admin must supply it when creating the first
     * details row — the DB enforces this if omitted.
     */
    await this.detailsRepository
      .createQueryBuilder()
      .insert()
      .values({ ...metadata, memoryPointId })
      .execute();
  }
}
