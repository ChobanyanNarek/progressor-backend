import { BaseDto } from '../../../common/dto/base.dto.ts';
import {
  ClassField,
  DateField,
  StringFieldOptional,
  UUIDField,
} from '../../../decorators/field.decorators.ts';
import { GeoPointDto } from './geo-point.dto.ts';

export class NearbyMemoryPointDto extends BaseDto {
  @UUIDField()
  id!: Uuid;

  @ClassField(() => GeoPointDto)
  location!: GeoPointDto;

  @StringFieldOptional()
  title?: string;

  @StringFieldOptional()
  description?: string;

  @DateField()
  createdAt!: Date;

  @DateField()
  updatedAt!: Date;
}
