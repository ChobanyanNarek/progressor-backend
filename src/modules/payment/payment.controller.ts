import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { RoleType } from '../../constants/role-type.ts';
import { AuthUser } from '../../decorators/auth-user.decorator.ts';
import { Auth } from '../../decorators/http.decorators.ts';
import type { UserEntity } from '../user/user.entity.ts';
import { InitPaymentDto } from './dtos/init-payment.dto.ts';
import { PaymentStatusDto } from './dtos/payment-status.dto.ts';
import { PaymentService } from './payment.service.ts';

class ConfirmPaymentBodyDto {
  orderId!: string;

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
  @Auth([RoleType.CREATOR, RoleType.ADMIN, RoleType.SUPER_ADMIN])
  @ApiOperation({ summary: 'Confirm payment after Ameriabank redirect' })
  confirmPayment(
    @AuthUser() user: UserEntity,
    @Body() body: ConfirmPaymentBodyDto,
  ): Promise<{ ok: boolean }> {
    return this.paymentService.confirmPayment(
      user.id,
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
}
