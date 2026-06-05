import { PageOptionsDto } from '../../../common/dto/page-options.dto.ts';
import {
  NumberField,
  StringFieldOptional,
} from '../../../decorators/field.decorators.ts';

export class NearbyMemoryPointsPageOptionsDto extends PageOptionsDto {
  @NumberField({ min: -90, max: 90 })
  readonly latitude!: number;

  @NumberField({ min: -180, max: 180 })
  readonly longitude!: number;

  @NumberField({ min: 100, max: 50_000, default: 5000 })
  readonly radiusMeters!: number;

  @StringFieldOptional()
  readonly name?: string;
}
