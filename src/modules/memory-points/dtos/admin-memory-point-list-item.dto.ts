import { BaseDto } from '../../../common/dto/base.dto.ts';
import { MemoryPointStatus } from '../../../constants/memory-point-status.ts';
import { MemoryPointType } from '../../../constants/memory-point-type.ts';
import {
  ClassField,
  ClassFieldOptional,
  DateField,
  EnumField,
  EnumFieldOptional,
  StringFieldOptional,
  UUIDField,
} from '../../../decorators/field.decorators.ts';
import { CreatorSummaryDto } from './creator-summary.dto.ts';
import { GeoPointDto } from './geo-point.dto.ts';

export class AdminMemoryPointListItemDto extends BaseDto {
  @UUIDField()
  id!: Uuid;

  @UUIDField()
  userId!: Uuid;

  @ClassField(() => GeoPointDto)
  location!: GeoPointDto;

  @EnumField(() => MemoryPointStatus)
  status!: MemoryPointStatus;

  /*
   * Optional: the admin list excludes PENDING, so non-PENDING points normally
   * carry a details row (and thus a type), but we stay defensive — a point
   * without details yields `undefined`.
   */
  @EnumFieldOptional(() => MemoryPointType)
  type?: MemoryPointType;

  @StringFieldOptional()
  title?: string;

  @StringFieldOptional()
  description?: string;

  // Source thumbnail (details.sourcePhotoUrl); null when no media is uploaded.
  @StringFieldOptional({ nullable: true })
  photoUrl?: string | null;

  @ClassFieldOptional(() => CreatorSummaryDto, { nullable: true })
  creator?: CreatorSummaryDto | null;

  @DateField()
  createdAt!: Date;

  @DateField()
  updatedAt!: Date;
}
