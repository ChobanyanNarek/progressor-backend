import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import { MemoryPointType } from '../../../constants/memory-point-type.ts';
import {
  EnumFieldOptional,
  StringFieldOptional,
  URLFieldOptional,
} from '../../../decorators/field.decorators.ts';
import type { MemoryPointDetailsEntity } from '../entities/memory-point-details.entity.ts';
import type { IMemoryPointDetailsOptions } from '../interfaces/memory-point-details-options.interface.ts';

export class MemoryPointDetailsDto extends AbstractDto {
  @StringFieldOptional()
  title?: string;

  @StringFieldOptional()
  description?: string;

  @StringFieldOptional()
  cloudAnchorId?: string;

  @URLFieldOptional()
  videoUrl?: string;

  @EnumFieldOptional(() => MemoryPointType, { nullable: true })
  type?: MemoryPointType | null;

  @StringFieldOptional({ nullable: true })
  sourcePhotoUrl?: string | null;

  @StringFieldOptional({ nullable: true })
  sourceAudioUrl?: string | null;

  constructor(
    entity: MemoryPointDetailsEntity,
    options?: IMemoryPointDetailsOptions,
  ) {
    super(entity);
    this.title = entity.title;
    this.description = entity.description;
    this.cloudAnchorId = entity.cloudAnchorId;
    this.videoUrl = entity.videoUrl;
    this.type = entity.type;

    if (options?.includeSourceUrls) {
      this.sourcePhotoUrl = entity.sourcePhotoUrl;
      this.sourceAudioUrl = entity.sourceAudioUrl;
    }
  }
}
