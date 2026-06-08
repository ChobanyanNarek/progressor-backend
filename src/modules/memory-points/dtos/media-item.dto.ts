import { BaseDto } from '../../../common/dto/base.dto.ts';
import { MemoryPointStatus } from '../../../constants/memory-point-status.ts';
import { MemoryPointType } from '../../../constants/memory-point-type.ts';
import {
  DateField,
  EnumField,
  StringField,
  StringFieldOptional,
  UUIDField,
} from '../../../decorators/field.decorators.ts';

export class MediaItemDto extends BaseDto {
  /** `memory_point_details` row id (the media bundle id). */
  @UUIDField()
  id!: Uuid;

  @UUIDField()
  memoryPointId!: Uuid;

  @StringFieldOptional({ nullable: true })
  title!: string | null;

  @EnumField(() => MemoryPointType)
  type!: MemoryPointType;

  @EnumField(() => MemoryPointStatus)
  status!: MemoryPointStatus;

  /** GCS object path of the source photo. */
  @StringField()
  photoUrl!: string;

  /** GCS object path of the source audio. */
  @StringField()
  audioUrl!: string;

  @StringFieldOptional({ nullable: true })
  videoUrl!: string | null;

  @DateField()
  createdAt!: Date;
}
