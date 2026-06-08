import { BaseDto } from '../../../common/dto/base.dto.ts';
import {
  ClassField,
  NumberField,
} from '../../../decorators/field.decorators.ts';
import { MemoryPointStatusBreakdownDto } from './memory-point-status-breakdown.dto.ts';

/** Aggregated memory point counts. Internal projection consumed by the dashboard. */
export class MemoryPointStatsDto extends BaseDto {
  @NumberField({ int: true })
  total!: number;

  @ClassField(() => MemoryPointStatusBreakdownDto)
  byStatus!: MemoryPointStatusBreakdownDto;
}
