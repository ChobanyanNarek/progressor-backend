import { BaseDto } from '../../../common/dto/base.dto.ts';
import { MemoryPointStatus } from '../../../constants/memory-point-status.ts';
import { MemoryPointType } from '../../../constants/memory-point-type.ts';
import {
  DateField,
  EnumField,
  EnumFieldOptional,
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

  @EnumFieldOptional(() => MemoryPointType, { nullable: true })
  type?: MemoryPointType | null;

  @EnumField(() => MemoryPointStatus)
  status!: MemoryPointStatus;

  /** GCS object path of the source photo; null until media is uploaded. */
  @StringFieldOptional({ nullable: true })
  photoUrl!: string | null;

  /** GCS object path of the source audio; null until media is uploaded. */
  @StringFieldOptional({ nullable: true })
  audioUrl!: string | null;

  @StringFieldOptional({ nullable: true })
  videoUrl!: string | null;

  @DateField()
  createdAt!: Date;
}
