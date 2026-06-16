import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { ADMIN_EDITABLE_STATUSES } from '../../../../constants/memory-point-status.ts';
import { GcsStorageService } from '../../../../shared/services/gcs-storage.service.ts';
import { GeneratorService } from '../../../../shared/services/generator.service.ts';
import { AdminMemoryPointUploadUrlsDto } from '../../dtos/admin-memory-point-upload-urls.dto.ts';
import { MemoryPointEntity } from '../../entities/memory-point.entity.ts';
import { MemoryPointNotEditableException } from '../../exceptions/memory-point-not-editable.exception.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import {
  AUDIO_MIME_BY_TYPE,
  buildAudioPath,
  buildPhotoPath,
  PHOTO_MIME_BY_TYPE,
} from '../../utils/media-upload.ts';
import { CreateAdminUploadUrlCommand } from './create-admin-upload-url.command.ts';

@CommandHandler(CreateAdminUploadUrlCommand)
export class CreateAdminUploadUrlHandler
  implements
    ICommandHandler<CreateAdminUploadUrlCommand, AdminMemoryPointUploadUrlsDto>
{
  constructor(
    @InjectRepository(MemoryPointEntity)
    private readonly memoryPointRepository: Repository<MemoryPointEntity>,
    private readonly gcsStorageService: GcsStorageService,
    private readonly generatorService: GeneratorService,
  ) {}

  async execute(
    command: CreateAdminUploadUrlCommand,
  ): Promise<AdminMemoryPointUploadUrlsDto> {
    const { memoryPointId, requestUploadUrlDto } = command;
    const { photoContentType, audioContentType } = requestUploadUrlDto;

    const memoryPoint = await this.memoryPointRepository
      .createQueryBuilder('memoryPoint')
      .where('memoryPoint.id = :id', { id: memoryPointId })
      .getOne();

    if (!memoryPoint) {
      throw new MemoryPointNotFoundException();
    }

    if (!ADMIN_EDITABLE_STATUSES.includes(memoryPoint.status)) {
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

    const [photoTarget, audioTarget] = await Promise.all([
      this.gcsStorageService.getSignedWriteTarget(
        photoPath,
        PHOTO_MIME_BY_TYPE[photoContentType],
      ),
      this.gcsStorageService.getSignedWriteTarget(
        audioPath,
        AUDIO_MIME_BY_TYPE[audioContentType],
      ),
    ]);

    return AdminMemoryPointUploadUrlsDto.create({
      photo: {
        uploadUrl: photoTarget.url,
        objectPath: photoPath,
        requiredHeaders: photoTarget.requiredHeaders,
      },
      audio: {
        uploadUrl: audioTarget.url,
        objectPath: audioPath,
        requiredHeaders: audioTarget.requiredHeaders,
      },
    });
  }
}
