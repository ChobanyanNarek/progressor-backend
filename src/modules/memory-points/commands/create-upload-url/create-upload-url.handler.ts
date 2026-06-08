import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { AudioFileType } from '../../../../constants/audio-file-type.ts';
import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { PhotoFileType } from '../../../../constants/photo-file-type.ts';
import { GcsStorageService } from '../../../../shared/services/gcs-storage.service.ts';
import { GeneratorService } from '../../../../shared/services/generator.service.ts';
import { MemoryPointUploadUrlsDto } from '../../dtos/memory-point-upload-urls.dto.ts';
import { MemoryPointEntity } from '../../entities/memory-point.entity.ts';
import { MemoryPointNotEditableException } from '../../exceptions/memory-point-not-editable.exception.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
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

  private static readonly photoMimeByType: Record<PhotoFileType, string> = {
    [PhotoFileType.JPG]: 'image/jpeg',
    [PhotoFileType.JPEG]: 'image/jpeg',
    [PhotoFileType.PNG]: 'image/png',
  };

  private static readonly audioMimeByType: Record<AudioFileType, string> = {
    [AudioFileType.MP3]: 'audio/mpeg',
    [AudioFileType.WAV]: 'audio/wav',
    [AudioFileType.M4A]: 'audio/mp4',
  };

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

    const photoPath = `memory-points/${memoryPointId}/photo/${this.generatorService.uuid()}.${photoContentType}`;
    const audioPath = `memory-points/${memoryPointId}/audio/${this.generatorService.uuid()}.${audioContentType}`;

    const [photoUrl, audioUrl] = await Promise.all([
      this.gcsStorageService.getSignedWriteUrl(
        photoPath,
        CreateUploadUrlHandler.photoMimeByType[photoContentType],
      ),
      this.gcsStorageService.getSignedWriteUrl(
        audioPath,
        CreateUploadUrlHandler.audioMimeByType[audioContentType],
      ),
    ]);

    return MemoryPointUploadUrlsDto.create({
      photo: { uploadUrl: photoUrl, objectPath: photoPath },
      audio: { uploadUrl: audioUrl, objectPath: audioPath },
    });
  }
}
