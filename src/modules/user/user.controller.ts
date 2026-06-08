import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { PageDto } from '../../common/dto/page.dto.ts';
import { RoleType } from '../../constants/role-type.ts';
import { ApiPageResponse } from '../../decorators/api-page-response.decorator.ts';
import {
  ApiUUIDParam,
  Auth,
  UUIDParam,
} from '../../decorators/http.decorators.ts';
import { CreateUserDto } from './dtos/create-user.dto.ts';
import { CreateUserResultDto } from './dtos/create-user-result.dto.ts';
import { EditUserDto } from './dtos/edit-user.dto.ts';
import { UpdateUserRoleDto } from './dtos/update-user-role.dto.ts';
import { UpdateUserStatusDto } from './dtos/update-user-status.dto.ts';
import { UserDto } from './dtos/user.dto.ts';
import { UserListDto } from './dtos/user-list.dto.ts';
import type { UsersPageOptionsDto } from './dtos/users-page-options.dto.ts';
import { UserService } from './user.service.ts';

@Controller('users')
@ApiTags('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @Auth([RoleType.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiPageResponse({
    description: 'Get users list',
    type: UserListDto,
  })
  getUsers(
    @Query(new ValidationPipe({ transform: true }))
    pageOptionsDto: UsersPageOptionsDto,
  ): Promise<PageDto<UserListDto>> {
    return this.userService.getUsers(pageOptionsDto);
  }

  @Post()
  @Auth([RoleType.ADMIN])
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Create user',
    // eslint-disable-next-line awesome-nest/unique-endpoint-dtos
    type: CreateUserResultDto,
  })
  createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<CreateUserResultDto> {
    return this.userService.create(createUserDto);
  }

  @Get(':id')
  @Auth([RoleType.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiUUIDParam('id')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Get user by id',
    // eslint-disable-next-line awesome-nest/unique-endpoint-dtos
    type: UserDto,
  })
  getUser(@UUIDParam('id') userId: Uuid): Promise<UserDto> {
    return this.userService.getUser(userId);
  }

  @Patch(':id')
  @Auth([RoleType.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiUUIDParam('id')
  @ApiOperation({ summary: 'Edit a user (name, email, role, avatar)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Edit user',
    // eslint-disable-next-line awesome-nest/unique-endpoint-dtos
    type: UserDto,
  })
  editUser(
    @UUIDParam('id') userId: Uuid,
    @Body() editUserDto: EditUserDto,
  ): Promise<UserDto> {
    return this.userService.editUser(userId, editUserDto);
  }

  @Delete(':id')
  @Auth([RoleType.ADMIN])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiUUIDParam('id')
  @ApiOperation({ summary: 'Delete a user' })
  deleteUser(@UUIDParam('id') userId: Uuid): Promise<void> {
    return this.userService.deleteUser(userId);
  }

  @Patch(':id/status')
  @Auth([RoleType.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiUUIDParam('id')
  @ApiOperation({ summary: 'Activate or deactivate a user account' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Update user status',
    // eslint-disable-next-line awesome-nest/unique-endpoint-dtos
    type: UserDto,
  })
  updateUserStatus(
    @UUIDParam('id') userId: Uuid,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
  ): Promise<UserDto> {
    return this.userService.updateUserStatus(
      userId,
      updateUserStatusDto.status,
    );
  }

  @Patch(':id/role')
  @Auth([RoleType.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiUUIDParam('id')
  @ApiOperation({ summary: 'Change a user role' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Update user role',
    // eslint-disable-next-line awesome-nest/unique-endpoint-dtos
    type: UserDto,
  })
  updateUserRole(
    @UUIDParam('id') userId: Uuid,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ): Promise<UserDto> {
    return this.userService.updateUserRole(userId, updateUserRoleDto.role);
  }
}
