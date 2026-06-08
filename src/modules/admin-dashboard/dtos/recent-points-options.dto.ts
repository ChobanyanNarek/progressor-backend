import { BaseDto } from '../../../common/dto/base.dto.ts';
import { NumberFieldOptional } from '../../../decorators/field.decorators.ts';

export class RecentPointsOptionsDto extends BaseDto {
  @NumberFieldOptional({
    minimum: 1,
    maximum: 20,
    default: 5,
    int: true,
  })
  readonly limit!: number;
}
