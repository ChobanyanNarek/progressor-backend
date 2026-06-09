import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { GcsStorageService } from '../../../../shared/services/gcs-storage.service.ts';
import { MemoryPointDetailsDto } from '../../dtos/memory-point-details.dto.ts';
import { MemoryPointEntity } from '../../entities/memory-point.entity.ts';
import { MemoryPointDetailsEntity } from '../../entities/memory-point-details.entity.ts';
import { MemoryPointNotEditableException } from '../../exceptions/memory-point-not-editable.exception.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { MemoryPointSourceNotUploadedException } from '../../exceptions/memory-point-source-not-uploaded.exception.ts';
import { UpsertMemoryPointDetailsCommand } from './upsert-memory-point-details.command.ts';

@CommandHandler(UpsertMemoryPointDetailsCommand)
export class UpsertMemoryPointDetailsHandler
  implements
    ICommandHandler<UpsertMemoryPointDetailsCommand, MemoryPointDetailsDto>
{
  constructor(
    @InjectRepository(MemoryPointEntity)
    private readonly memoryPointRepository: Repository<MemoryPointEntity>,
    @InjectRepository(MemoryPointDetailsEntity)
    private readonly memoryPointDetailsRepository: Repository<MemoryPointDetailsEntity>,
    private readonly gcsStorageService: GcsStorageService,
  ) {}

  @Transactional()
  async execute(
    command: UpsertMemoryPointDetailsCommand,
  ): Promise<MemoryPointDetailsDto> {
    const { memoryPointId, userId, upsertMemoryPointDetailsDto } = command;
    const {
      sourcePhotoUrl,
      sourceAudioUrl,
      title,
      description,
      cloudAnchorId,
      type,
    } = upsertMemoryPointDetailsDto;

    const memoryPoint = await this.memoryPointRepository
      .createQueryBuilder('memoryPoint')
      .where('memoryPoint.id = :id', { id: memoryPointId })
      .getOne();

    if (memoryPoint?.userId !== userId) {
      throw new MemoryPointNotFoundException();
    }

    if (memoryPoint.status !== MemoryPointStatus.PENDING) {
      throw new MemoryPointNotEditableException();
    }

    /*
     * Trust no client-supplied path blindly. First require each path to live
     * under this memory point's own prefix, so a CREATOR cannot reference
     * another point's object (or any nameable object) as their source. Then
     * confirm both files actually landed in storage before persisting them.
     */
    const photoPrefix = `memory-points/${memoryPointId}/photo/`;
    const audioPrefix = `memory-points/${memoryPointId}/audio/`;

    if (
      !sourcePhotoUrl.startsWith(photoPrefix) ||
      !sourceAudioUrl.startsWith(audioPrefix)
    ) {
      throw new MemoryPointSourceNotUploadedException();
    }

    const [hasPhoto, hasAudio] = await Promise.all([
      this.gcsStorageService.exists(sourcePhotoUrl),
      this.gcsStorageService.exists(sourceAudioUrl),
    ]);

    if (!hasPhoto || !hasAudio) {
      throw new MemoryPointSourceNotUploadedException();
    }

    await this.memoryPointDetailsRepository.upsert(
      this.memoryPointDetailsRepository.create({
        title,
        description,
        cloudAnchorId,
        type,
        sourcePhotoUrl,
        sourceAudioUrl,
        memoryPointId,
      }),
      ['memoryPointId'],
    );

    /*
     * Submitting details completes the point: it now has a face photo, audio
     * and metadata, so it leaves the creator-only PENDING draft state and enters
     * the admin review queue. Admin-facing lists surface points from
     * ADMIN_REVIEWING onward; PENDING stays creator-private.
     */
    await this.memoryPointRepository.update(
      { id: memoryPointId },
      { status: MemoryPointStatus.ADMIN_REVIEWING },
    );

    const details = await this.memoryPointDetailsRepository
      .createQueryBuilder('details')
      .where('details.memoryPointId = :memoryPointId', { memoryPointId })
      .getOneOrFail();

    return details.toDto();
  }
}
