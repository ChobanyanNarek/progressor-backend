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

  /** Short-lived signed read URL for the source photo; null until uploaded. */
  @StringFieldOptional({ nullable: true })
  photoUrl!: string | null;

  /** Short-lived signed read URL for the source audio; null until uploaded. */
  @StringFieldOptional({ nullable: true })
  audioUrl!: string | null;

  /** Short-lived signed read URL for the result video; null until generated. */
  @StringFieldOptional({ nullable: true })
  videoUrl!: string | null;

  @DateField()
  createdAt!: Date;
}
