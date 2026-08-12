import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

import { BaseDto } from '../../../common/dto/base.dto.ts';
import { RoleType } from '../../../constants/role-type.ts';
import {
  BooleanFieldOptional,
  EmailField,
  EnumField,
  StringField,
  StringFieldOptional,
  UUIDField,
} from '../../../decorators/field.decorators.ts';

export class GetMeDto extends BaseDto {
  @UUIDField()
  id!: Uuid;

  @StringField()
  firstName!: string;

  @StringField()
  lastName!: string;

  @EmailField()
  email!: string;

  @EnumField(() => RoleType)
  role!: RoleType;

  @StringFieldOptional({ nullable: true })
  avatar?: string | null;

  @BooleanFieldOptional()
  subscriptionActive?: boolean;

  @ApiPropertyOptional({ type: String, nullable: true })
  @Expose()
  @IsOptional()
  @IsDate()
  subscriptionUntil?: Date | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @Expose()
  @IsOptional()
  @IsDate()
  trialUntil?: Date | null;
}
