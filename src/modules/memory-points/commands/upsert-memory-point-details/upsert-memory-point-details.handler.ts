import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { GcsStorageService } from '../../../../shared/services/gcs-storage.service.ts';
import { MemoryPointDetailsDto } from '../../dtos/memory-point-details.dto.ts';
import { MemoryPointEntity } from '../../entities/memory-point.entity.ts';
import { MemoryPointDetailsEntity } from '../../entities/memory-point-details.entity.ts';
import { MemoryPointContentRequiredException } from '../../exceptions/memory-point-content-required.exception.ts';
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

    /*
     * Creator may submit details on a fresh draft (PENDING) and may re-submit a
     * REJECTED point to fix and resend it for review. Once the point is in
     * ADMIN_REVIEWING or further (GENERATING / AI_REVIEWING / APPROVED) it is
     * frozen to the creator. A successful (re)submit (re-)enters ADMIN_REVIEWING.
     */
    const creatorEditableStatuses = [
      MemoryPointStatus.PENDING,
      MemoryPointStatus.REJECTED,
    ];

    if (!creatorEditableStatuses.includes(memoryPoint.status)) {
      throw new MemoryPointNotEditableException();
    }

    /*
     * Title is always required (enforced by the DTO). Beyond that a point must
     * carry at least one piece of content — a photo, audio or a description — so
     * a creator can submit e.g. a text-only AR point. Whichever are omitted stay
     * unset; video generation later requires the full set and the admin fills
     * any gaps.
     */
    if (!sourcePhotoUrl && !sourceAudioUrl && !description) {
      throw new MemoryPointContentRequiredException();
    }

    /*
     * Trust no client-supplied path blindly. For each source that IS provided,
     * require it to live under this memory point's own prefix (so a CREATOR
     * cannot reference another point's object), then confirm the file actually
     * landed in storage before persisting it.
     */
    const photoPrefix = `memory-points/${memoryPointId}/photo/`;
    const audioPrefix = `memory-points/${memoryPointId}/audio/`;

    if (
      (sourcePhotoUrl && !sourcePhotoUrl.startsWith(photoPrefix)) ||
      (sourceAudioUrl && !sourceAudioUrl.startsWith(audioPrefix))
    ) {
      throw new MemoryPointSourceNotUploadedException();
    }

    const [hasPhoto, hasAudio] = await Promise.all([
      sourcePhotoUrl
        ? this.gcsStorageService.exists(sourcePhotoUrl)
        : Promise.resolve(true),
      sourceAudioUrl
        ? this.gcsStorageService.exists(sourceAudioUrl)
        : Promise.resolve(true),
    ]);

    if (!hasPhoto || !hasAudio) {
      throw new MemoryPointSourceNotUploadedException();
    }

    /*
     * Persist only the fields the creator actually provided (title always).
     * `upsert` on the memoryPointId conflict updates just these columns, so a
     * re-submit (REJECTED -> ADMIN_REVIEWING) that omits a field preserves the
     * previously stored value rather than clearing it.
     */
    const detailsToUpsert: Partial<MemoryPointDetailsEntity> = {
      title,
      memoryPointId,
    };

    if (description !== undefined) {
      detailsToUpsert.description = description;
    }

    if (cloudAnchorId !== undefined) {
      detailsToUpsert.cloudAnchorId = cloudAnchorId;
    }

    if (type !== undefined) {
      detailsToUpsert.type = type;
    }

    if (sourcePhotoUrl !== undefined) {
      detailsToUpsert.sourcePhotoUrl = sourcePhotoUrl;
    }

    if (sourceAudioUrl !== undefined) {
      detailsToUpsert.sourceAudioUrl = sourceAudioUrl;
    }

    await this.memoryPointDetailsRepository.upsert(
      this.memoryPointDetailsRepository.create(detailsToUpsert),
      ['memoryPointId'],
    );

    /*
     * Submitting details moves the point out of the creator-only PENDING draft
     * state and into the admin review queue. Admin-facing lists surface points
     * from ADMIN_REVIEWING onward; PENDING stays creator-private.
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
