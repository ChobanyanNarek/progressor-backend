import { BaseDto } from '../../../common/dto/base.dto.ts';
import { NumberFieldOptional } from '../../../decorators/field.decorators.ts';

export class PmTrackerRecordsQueryDto extends BaseDto {
  // Only records changed after this revision; omitted for everything.
  @NumberFieldOptional({ int: true, min: 0 })
  readonly since?: number;
}
