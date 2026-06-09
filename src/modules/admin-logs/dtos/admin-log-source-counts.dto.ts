import { BaseDto } from '../../../common/dto/base.dto.ts';
import { NumberField } from '../../../decorators/field.decorators.ts';

/**
 * Per-source totals for the whole (unpaginated, but filter-respecting) log set.
 * One non-negative integer per `LogSource` value.
 */
export class AdminLogSourceCountsDto extends BaseDto {
  @NumberField({ int: true, min: 0 })
  api!: number;

  @NumberField({ int: true, min: 0 })
  ar!: number;

  @NumberField({ int: true, min: 0 })
  did!: number;

  @NumberField({ int: true, min: 0 })
  maps!: number;

  @NumberField({ int: true, min: 0 })
  auth!: number;
}
