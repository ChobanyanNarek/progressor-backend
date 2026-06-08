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
     * Trust no client-supplied path blindly: confirm both files were actually
     * uploaded to storage before persisting them as the AI-generation source.
     */
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

    const details = await this.memoryPointDetailsRepository
      .createQueryBuilder('details')
      .where('details.memoryPointId = :memoryPointId', { memoryPointId })
      .getOneOrFail();

    return details.toDto();
  }
}
