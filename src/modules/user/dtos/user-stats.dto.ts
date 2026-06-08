import { BaseDto } from '../../../common/dto/base.dto.ts';
import {
  ClassField,
  NumberField,
} from '../../../decorators/field.decorators.ts';
import { UserRoleBreakdownDto } from './user-role-breakdown.dto.ts';

/** Aggregated user counts. Internal projection consumed by the dashboard. */
export class UserStatsDto extends BaseDto {
  @NumberField({ int: true })
  total!: number;

  @ClassField(() => UserRoleBreakdownDto)
  byRole!: UserRoleBreakdownDto;
}
