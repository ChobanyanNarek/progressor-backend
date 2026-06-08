import { BaseDto } from '../../../common/dto/base.dto.ts';
import {
  ClassField,
  NumberField,
} from '../../../decorators/field.decorators.ts';
import { MemoryPointStatusBreakdownDto } from './memory-point-status-breakdown.dto.ts';

export class DashboardStatsDto extends BaseDto {
  @NumberField({ int: true })
  totalUsers!: number;

  @NumberField({ int: true })
  totalCreators!: number;

  @NumberField({ int: true })
  totalAdmins!: number;

  @NumberField({ int: true })
  totalMemoryPoints!: number;

  @ClassField(() => MemoryPointStatusBreakdownDto)
  memoryPointsByStatus!: MemoryPointStatusBreakdownDto;
}
