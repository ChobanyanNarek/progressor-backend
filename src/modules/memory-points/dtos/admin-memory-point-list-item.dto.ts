import { BaseDto } from '../../../common/dto/base.dto.ts';
import { MemoryPointStatus } from '../../../constants/memory-point-status.ts';
import {
  ClassField,
  DateField,
  EnumField,
  StringFieldOptional,
  UUIDField,
} from '../../../decorators/field.decorators.ts';
import { GeoPointDto } from './geo-point.dto.ts';

export class AdminMemoryPointListItemDto extends BaseDto {
  @UUIDField()
  id!: Uuid;

  @ClassField(() => GeoPointDto)
  location!: GeoPointDto;

  @EnumField(() => MemoryPointStatus)
  status!: MemoryPointStatus;

  @StringFieldOptional()
  title?: string;

  @StringFieldOptional()
  description?: string;

  @DateField()
  createdAt!: Date;

  @DateField()
  updatedAt!: Date;
}
