import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

import { BaseDto } from '../../../common/dto/base.dto.ts';
import {
  BooleanField,
  NumberField,
  StringFieldOptional,
} from '../../../decorators/field.decorators.ts';

export class LastPaymentDto extends BaseDto {
  @NumberField()
  amount!: number;

  @StringFieldOptional()
  currency?: string;

  @StringFieldOptional()
  status?: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @Expose()
  @IsOptional()
  @IsDate()
  completedAt?: Date | null;

  @StringFieldOptional({ nullable: true })
  cardNumber?: string | null;
}

export class PaymentStatusDto extends BaseDto {
  @BooleanField()
  subscriptionActive!: boolean;

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

  @ApiPropertyOptional({ type: LastPaymentDto, nullable: true })
  @Expose()
  @IsOptional()
  @Type(() => LastPaymentDto)
  lastPayment?: LastPaymentDto | null;
}
