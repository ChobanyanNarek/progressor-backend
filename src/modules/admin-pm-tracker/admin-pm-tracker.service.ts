import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { DeleteUserCommand } from '../user/commands/delete-user/delete-user.command.ts';
import { AdminChangePasswordCommand } from './commands/admin-change-password/admin-change-password.command.ts';
import { DeleteUserDataCommand } from './commands/delete-user-data/delete-user-data.command.ts';
import type { AdminPmTrackerUsersDto } from './dtos/admin-pm-tracker-users.dto.ts';
import { GetAdminUsersQuery } from './queries/get-admin-users/get-admin-users.query.ts';

@Injectable()
export class AdminPmTrackerService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  getUsers(): Promise<AdminPmTrackerUsersDto> {
    return this.queryBus.execute<GetAdminUsersQuery, AdminPmTrackerUsersDto>(
      new GetAdminUsersQuery(),
    );
  }

  deleteUser(userId: Uuid): Promise<void> {
    return this.commandBus.execute<DeleteUserCommand>(
      new DeleteUserCommand(userId),
    );
  }

  deleteUserData(userId: Uuid): Promise<void> {
    return this.commandBus.execute<DeleteUserDataCommand>(
      new DeleteUserDataCommand(userId),
    );
  }

  changePassword(userId: Uuid, password: string): Promise<void> {
    return this.commandBus.execute<AdminChangePasswordCommand>(
      new AdminChangePasswordCommand(userId, password),
    );
  }
}
