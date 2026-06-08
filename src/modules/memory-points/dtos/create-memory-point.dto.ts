import { BaseDto } from '../../../common/dto/base.dto.ts';
import { NumberField } from '../../../decorators/field.decorators.ts';

export class CreateMemoryPointDto extends BaseDto {
  @NumberField({ min: -90, max: 90, example: 40.1872 })
  latitude!: number;

  @NumberField({ min: -180, max: 180, example: 44.5152 })
  longitude!: number;
}
