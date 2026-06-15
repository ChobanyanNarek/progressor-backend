import { BaseDto } from '../../../common/dto/base.dto.ts';
import {
  BooleanFieldOptional,
  NumberField,
} from '../../../decorators/field.decorators.ts';

export class CreateMemoryPointDto extends BaseDto {
  @NumberField({ min: -90, max: 90, example: 40.1872 })
  latitude!: number;

  @NumberField({ min: -180, max: 180, example: 44.5152 })
  longitude!: number;

  /**
   * When true, bypass duplicate-proximity detection and create the point even
   * if an existing point lies within DUPLICATE_RADIUS_METERS. Defaults to false.
   */
  @BooleanFieldOptional()
  readonly force?: boolean;
}
