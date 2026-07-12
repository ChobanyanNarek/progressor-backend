import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChangeMyPasswordHandler } from './commands/change-my-password/change-my-password.handler.ts';
import { CreateUserHandler } from './commands/create-user/create-user.handler.ts';
import { DeleteUserHandler } from './commands/delete-user/delete-user.handler.ts';
import { EditUserHandler } from './commands/edit-user/edit-user.handler.ts';
import { UpdateMyProfileHandler } from './commands/update-my-profile/update-my-profile.handler.ts';
import { UpdateUserHandler } from './commands/update-user/update-user.handler.ts';
import { UpdateUserRoleHandler } from './commands/update-user-role/update-user-role.handler.ts';
import { UpdateUserStatusHandler } from './commands/update-user-status/update-user-status.handler.ts';
import { GetUserHandler } from './queries/get-user/get-user.handler.ts';
import { GetUserStatsHandler } from './queries/get-user-stats/get-user-stats.handler.ts';
import { GetUsersHandler } from './queries/get-users/get-users.handler.ts';
import { UserController } from './user.controller.ts';
import { UserEntity } from './user.entity.ts';
import { UserService } from './user.service.ts';

const commandHandlers = [
  CreateUserHandler,
  UpdateUserHandler,
  EditUserHandler,
  DeleteUserHandler,
  UpdateUserStatusHandler,
  UpdateUserRoleHandler,
  UpdateMyProfileHandler,
  ChangeMyPasswordHandler,
];
const queryHandlers = [GetUserHandler, GetUsersHandler, GetUserStatsHandler];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([UserEntity])],
  controllers: [UserController],
  exports: [UserService],
  providers: [UserService, ...commandHandlers, ...queryHandlers],
})
export class UserModule {}
