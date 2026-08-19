import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { RoleType } from '../../constants/role-type.ts';
import { AuthUser } from '../../decorators/auth-user.decorator.ts';
import { Auth } from '../../decorators/http.decorators.ts';
import type { UserEntity } from '../user/user.entity.ts';
// confirm endpoint is intentionally public — paymentId is a secret UUID from Ameriabank
import { InitPaymentDto } from './dtos/init-payment.dto.ts';
import { PaymentStatusDto } from './dtos/payment-status.dto.ts';
import { PaymentService } from './payment.service.ts';

import { IsString } from 'class-validator';

class ConfirmPaymentBodyDto {
  @IsString()
  orderId!: string;

  @IsString()
  paymentId!: string;
}

@Controller('payment')
@ApiTags('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('init')
  @HttpCode(HttpStatus.OK)
  @Auth([RoleType.CREATOR, RoleType.ADMIN, RoleType.SUPER_ADMIN])
  @ApiOperation({
    summary: 'Initiate a payment — returns Ameriabank redirect URL',
  })
  // eslint-disable-next-line awesome-nest/unique-endpoint-dtos
  @ApiOkResponse({ type: InitPaymentDto })
  initPayment(@AuthUser() user: UserEntity): Promise<InitPaymentDto> {
    return this.paymentService.initPayment(user.id);
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm payment after Ameriabank redirect — no auth required, looks up user by paymentId' })
  confirmPayment(
    @Body() body: ConfirmPaymentBodyDto,
  ): Promise<{ ok: boolean }> {
    return this.paymentService.confirmPayment(
      body.orderId,
      body.paymentId,
    );
  }

  @Get('status')
  @HttpCode(HttpStatus.OK)
  @Auth([RoleType.CREATOR, RoleType.ADMIN, RoleType.SUPER_ADMIN])
  @ApiOperation({ summary: 'Get current user subscription status' })
  // eslint-disable-next-line awesome-nest/unique-endpoint-dtos
  @ApiOkResponse({ type: PaymentStatusDto })
  getStatus(@AuthUser() user: UserEntity): Promise<PaymentStatusDto> {
    return this.paymentService.getStatus(user.id);
  }

  @Get('history')
  @HttpCode(HttpStatus.OK)
  @Auth([RoleType.CREATOR, RoleType.ADMIN, RoleType.SUPER_ADMIN])
  @ApiOperation({ summary: 'Get payment history for current user' })
  getHistory(@AuthUser() user: UserEntity) {
    return this.paymentService.getHistory(user.id);
  }

  @Post('refund/:paymentId')
  @HttpCode(HttpStatus.OK)
  @Auth([RoleType.CREATOR, RoleType.ADMIN, RoleType.SUPER_ADMIN])
  @ApiOperation({ summary: 'Refund a completed payment and revoke subscription' })
  refundPayment(
    @Param('paymentId') paymentId: string,
    @AuthUser() user: UserEntity,
  ): Promise<{ ok: boolean; message?: string }> {
    return this.paymentService.refundPayment(paymentId, user.id);
  }
}
