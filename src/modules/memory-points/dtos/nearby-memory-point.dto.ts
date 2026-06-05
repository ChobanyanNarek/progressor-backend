import { BaseDto } from '../../../common/dto/base.dto.ts';
import { ClassField, UUIDField } from '../../../decorators/field.decorators.ts';
import { GeoPointDto } from './geo-point.dto.ts';

export class NearbyMemoryPointDto extends BaseDto {
  @UUIDField()
  id!: Uuid;

  @ClassField(() => GeoPointDto)
  location!: GeoPointDto;
}
