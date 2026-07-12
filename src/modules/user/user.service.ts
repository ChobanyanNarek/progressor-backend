import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { FindOptionsWhere, Repository } from 'typeorm';

import type { PageDto } from '../../common/dto/page.dto.ts';
import type { AccountStatus } from '../../constants/account-status.ts';
import type { RoleType } from '../../constants/role-type.ts';
import { ChangeMyPasswordCommand } from './commands/change-my-password/change-my-password.command.ts';
import { CreateUserCommand } from './commands/create-user/create-user.command.ts';
import { DeleteUserCommand } from './commands/delete-user/delete-user.command.ts';
import { EditUserCommand } from './commands/edit-user/edit-user.command.ts';
import { UpdateMyProfileCommand } from './commands/update-my-profile/update-my-profile.command.ts';
import { UpdateUserCommand } from './commands/update-user/update-user.command.ts';
import { UpdateUserRoleCommand } from './commands/update-user-role/update-user-role.command.ts';
import { UpdateUserStatusCommand } from './commands/update-user-status/update-user-status.command.ts';
import type { ChangeMyPasswordDto } from './dtos/change-my-password.dto.ts';
import type { CreateUserDto } from './dtos/create-user.dto.ts';
import { CreateUserResultDto } from './dtos/create-user-result.dto.ts';
import type { EditUserDto } from './dtos/edit-user.dto.ts';
import type { UpdateMyProfileDto } from './dtos/update-my-profile.dto.ts';
import type { UpdateUserDto } from './dtos/update-user.dto.ts';
import type { UserDto } from './dtos/user.dto.ts';
import type { UserListDto } from './dtos/user-list.dto.ts';
import type { UserStatsDto } from './dtos/user-stats.dto.ts';
import type { UsersPageOptionsDto } from './dtos/users-page-options.dto.ts';
import { GetUserQuery } from './queries/get-user/get-user.query.ts';
import { GetUserStatsQuery } from './queries/get-user-stats/get-user-stats.query.ts';
import { GetUsersQuery } from './queries/get-users/get-users.query.ts';
import { UserEntity } from './user.entity.ts';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  findOne(findData: FindOptionsWhere<UserEntity>): Promise<UserEntity | null> {
    // eslint-disable-next-line awesome-nest/no-typeorm-finder-methods
    return this.userRepository.findOneBy(findData);
  }

  create(createUserDto: CreateUserDto): Promise<CreateUserResultDto> {
    return this.commandBus.execute<CreateUserCommand>(
      new CreateUserCommand(createUserDto),
    );
  }

  getUsers(pageOptionsDto: UsersPageOptionsDto): Promise<PageDto<UserListDto>> {
    return this.queryBus.execute<GetUsersQuery, PageDto<UserListDto>>(
      new GetUsersQuery(pageOptionsDto),
    );
  }

  getUser(userId: Uuid): Promise<UserDto> {
    return this.queryBus.execute<GetUserQuery, UserDto>(
      new GetUserQuery(userId),
    );
  }

  getStats(): Promise<UserStatsDto> {
    return this.queryBus.execute<GetUserStatsQuery, UserStatsDto>(
      new GetUserStatsQuery(),
    );
  }

  update(userId: Uuid, updateUserDto: UpdateUserDto): Promise<void> {
    return this.commandBus.execute<UpdateUserCommand>(
      new UpdateUserCommand(userId, updateUserDto),
    );
  }

  editUser(userId: Uuid, editUserDto: EditUserDto): Promise<UserDto> {
    return this.commandBus.execute<EditUserCommand, UserDto>(
      new EditUserCommand(userId, editUserDto),
    );
  }

  deleteUser(userId: Uuid): Promise<void> {
    return this.commandBus.execute<DeleteUserCommand>(
      new DeleteUserCommand(userId),
    );
  }

  updateUserStatus(userId: Uuid, status: AccountStatus): Promise<UserDto> {
    return this.commandBus.execute<UpdateUserStatusCommand, UserDto>(
      new UpdateUserStatusCommand(userId, status),
    );
  }

  updateUserRole(userId: Uuid, role: RoleType): Promise<UserDto> {
    return this.commandBus.execute<UpdateUserRoleCommand, UserDto>(
      new UpdateUserRoleCommand(userId, role),
    );
  }

  updateMyProfile(userId: Uuid, dto: UpdateMyProfileDto): Promise<void> {
    return this.commandBus.execute<UpdateMyProfileCommand>(
      new UpdateMyProfileCommand(userId, dto),
    );
  }

  changeMyPassword(userId: Uuid, dto: ChangeMyPasswordDto): Promise<void> {
    return this.commandBus.execute<ChangeMyPasswordCommand>(
      new ChangeMyPasswordCommand(userId, dto),
    );
  }
}
