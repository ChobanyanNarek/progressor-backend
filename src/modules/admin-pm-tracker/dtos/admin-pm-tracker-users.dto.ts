import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { BaseDto } from '../../../common/dto/base.dto.ts';
import { NumberField } from '../../../decorators/field.decorators.ts';
import { AdminPmTrackerUserDto } from './admin-pm-tracker-user.dto.ts';

export class AdminPmTrackerUsersDto extends BaseDto {
  @ApiProperty({ type: [AdminPmTrackerUserDto] })
  @Expose()
  @Type(() => AdminPmTrackerUserDto)
  users!: AdminPmTrackerUserDto[];

  @NumberField({ int: true, min: 0 })
  total!: number;
}
