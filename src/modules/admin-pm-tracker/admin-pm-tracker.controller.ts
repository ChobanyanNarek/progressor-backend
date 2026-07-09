import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Put,
} from '@nestjs/common';
import {
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { RoleType } from '../../constants/role-type.ts';
import { Auth, UUIDParam } from '../../decorators/http.decorators.ts';
import { AdminPmTrackerService } from './admin-pm-tracker.service.ts';
import { AdminChangePasswordDto } from './dtos/admin-change-password.dto.ts';
import { AdminPmTrackerUsersDto } from './dtos/admin-pm-tracker-users.dto.ts';

@Controller('admin/pm-tracker')
@ApiTags('admin-pm-tracker')
export class AdminPmTrackerController {
  constructor(private readonly service: AdminPmTrackerService) {}

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
}
