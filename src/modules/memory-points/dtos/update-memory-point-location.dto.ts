import { BaseDto } from '../../../common/dto/base.dto.ts';
import { NumberField } from '../../../decorators/field.decorators.ts';

export class UpdateMemoryPointLocationDto extends BaseDto {
  @NumberField({ min: -90, max: 90 })
  readonly latitude!: number;

  @NumberField({ min: -180, max: 180 })
  readonly longitude!: number;
}
