import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { GcsStorageService } from '../../../../shared/services/gcs-storage.service.ts';
import { GeneratorService } from '../../../../shared/services/generator.service.ts';
import { MemoryPointUploadUrlsDto } from '../../dtos/memory-point-upload-urls.dto.ts';
import { MemoryPointEntity } from '../../entities/memory-point.entity.ts';
import { MemoryPointNotEditableException } from '../../exceptions/memory-point-not-editable.exception.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import {
  AUDIO_MIME_BY_TYPE,
  buildAudioPath,
  buildPhotoPath,
  PHOTO_MIME_BY_TYPE,
} from '../../utils/media-upload.ts';
import { CreateUploadUrlCommand } from './create-upload-url.command.ts';

@CommandHandler(CreateUploadUrlCommand)
export class CreateUploadUrlHandler
  implements ICommandHandler<CreateUploadUrlCommand, MemoryPointUploadUrlsDto>
{
  constructor(
    @InjectRepository(MemoryPointEntity)
    private readonly memoryPointRepository: Repository<MemoryPointEntity>,
    private readonly gcsStorageService: GcsStorageService,
    private readonly generatorService: GeneratorService,
  ) {}

  async execute(
    command: CreateUploadUrlCommand,
  ): Promise<MemoryPointUploadUrlsDto> {
    const { memoryPointId, userId, requestUploadUrlDto } = command;
    const { photoContentType, audioContentType } = requestUploadUrlDto;

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

    const photoPath = buildPhotoPath(
      memoryPointId,
      this.generatorService.uuid(),
      photoContentType,
    );
    const audioPath = buildAudioPath(
      memoryPointId,
      this.generatorService.uuid(),
      audioContentType,
    );

    const [photoUrl, audioUrl] = await Promise.all([
      this.gcsStorageService.getSignedWriteUrl(
        photoPath,
        PHOTO_MIME_BY_TYPE[photoContentType],
      ),
      this.gcsStorageService.getSignedWriteUrl(
        audioPath,
        AUDIO_MIME_BY_TYPE[audioContentType],
      ),
    ]);

    return MemoryPointUploadUrlsDto.create({
      photo: { uploadUrl: photoUrl, objectPath: photoPath },
      audio: { uploadUrl: audioUrl, objectPath: audioPath },
    });
  }
}
