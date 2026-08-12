import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

import { BaseDto } from '../../../common/dto/base.dto.ts';
import {
  EnumField,
  NumberField,
  StringField,
  StringFieldOptional,
  UUIDField,
} from '../../../decorators/field.decorators.ts';
import { PaymentStatus } from '../entities/payment.entity.ts';

export class AdminPaymentDto extends BaseDto {
  @UUIDField()
  id!: Uuid;

  @UUIDField()
  userId!: Uuid;

  @StringField()
  userEmail!: string;

  @StringField()
  userName!: string;

  @NumberField()
  amount!: number;

  @StringField()
  currency!: string;

  @EnumField(() => PaymentStatus)
  status!: PaymentStatus;

  @StringField()
  paymentId!: string;

  @StringField()
  orderId!: string;

  @StringFieldOptional({ nullable: true })
  cardNumber?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @Expose()
  @IsOptional()
  @IsDate()
  completedAt?: Date | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @Expose()
  @IsOptional()
  @IsDate()
  subscriptionUntil?: Date | null;
}

export class AdminPaymentsDto extends BaseDto {
  @Expose()
  @Type(() => AdminPaymentDto)
  payments!: AdminPaymentDto[];

  @NumberField({ int: true, min: 0 })
  total!: number;
}
