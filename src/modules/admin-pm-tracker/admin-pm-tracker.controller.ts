import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { RoleType } from '../../constants/role-type.ts';
import { NumberFieldOptional } from '../../decorators/field.decorators.ts';
import { Auth, UUIDParam } from '../../decorators/http.decorators.ts';
import { AdminPaymentsDto } from '../payment/dtos/admin-payments.dto.ts';
import { PaymentService } from '../payment/payment.service.ts';
import { AdminPmTrackerService } from './admin-pm-tracker.service.ts';
import { AdminChangePasswordDto } from './dtos/admin-change-password.dto.ts';
import { AdminPmTrackerUsersDto } from './dtos/admin-pm-tracker-users.dto.ts';

class GrantSubscriptionDto {
  @NumberFieldOptional({ int: true, min: 0 })
  months?: number;

  @NumberFieldOptional({ int: true, min: 0 })
  days?: number;
}

@Controller('admin/pm-tracker')
@ApiTags('admin-pm-tracker')
export class AdminPmTrackerController {
  constructor(
    private readonly service: AdminPmTrackerService,
    private readonly paymentService: PaymentService,
  ) {}

  @Get('users')
  @HttpCode(HttpStatus.OK)
  @Auth([RoleType.ADMIN])
  @ApiOperation({ summary: 'List all users with their pm-tracker stats' })
  // eslint-disable-next-line awesome-nest/unique-endpoint-dtos
  @ApiOkResponse({ type: AdminPmTrackerUsersDto })
  getUsers(): Promise<AdminPmTrackerUsersDto> {
    return this.service.getUsers();
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth([RoleType.ADMIN])
  @ApiOperation({ summary: 'Delete a user account and all their data' })
  @ApiNoContentResponse()
  deleteUser(@UUIDParam('id') userId: Uuid): Promise<void> {
    return this.service.deleteUser(userId);
  }

  @Delete('users/:id/data')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth([RoleType.ADMIN])
  @ApiOperation({
    summary: "Delete a user's pm-tracker data while keeping the account",
  })
  @ApiNoContentResponse()
  deleteUserData(@UUIDParam('id') userId: Uuid): Promise<void> {
    return this.service.deleteUserData(userId);
  }

  @Put('users/:id/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth([RoleType.ADMIN])
  @ApiOperation({ summary: "Change a user's password" })
  @ApiNoContentResponse()
  changePassword(
    @UUIDParam('id') userId: Uuid,
    @Body() dto: AdminChangePasswordDto,
  ): Promise<void> {
    return this.service.changePassword(userId, dto.password);
  }

  @Post('users/:id/subscription')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth([RoleType.ADMIN])
  @ApiOperation({ summary: 'Manually grant subscription months to a user' })
  @ApiNoContentResponse()
  grantSubscription(
    @UUIDParam('id') userId: Uuid,
    @Body() dto: GrantSubscriptionDto,
  ): Promise<void> {
    return this.paymentService.grantSubscription(
      userId,
      dto.months ?? 0,
      dto.days ?? 0,
    );
  }

  @Delete('users/:id/subscription')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth([RoleType.ADMIN])
  @ApiOperation({ summary: 'Revoke subscription from a user' })
  @ApiNoContentResponse()
  revokeSubscription(@UUIDParam('id') userId: Uuid): Promise<void> {
    return this.paymentService.revokeSubscription(userId);
  }

  @Get('payments')
  @HttpCode(HttpStatus.OK)
  @Auth([RoleType.ADMIN])
  @ApiOperation({ summary: 'List all payments' })
  // eslint-disable-next-line awesome-nest/unique-endpoint-dtos
  @ApiOkResponse({ type: AdminPaymentsDto })
  getPayments(): Promise<AdminPaymentsDto> {
    return this.paymentService.getAdminPayments();
  }
}
