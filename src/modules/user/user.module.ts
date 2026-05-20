import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CreateUserHandler } from './commands/create-user/create-user.handler.ts';
import { UpdateUserHandler } from './commands/update-user/update-user.handler.ts';
import { GetUserHandler } from './queries/get-user/get-user.handler.ts';
import { GetUsersHandler } from './queries/get-users/get-users.handler.ts';
import { UserController } from './user.controller.ts';
import { UserEntity } from './user.entity.ts';
import { UserService } from './user.service.ts';

const commandHandlers = [CreateUserHandler, UpdateUserHandler];
const queryHandlers = [GetUserHandler, GetUsersHandler];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([UserEntity])],
  controllers: [UserController],
  exports: [UserService],
  providers: [UserService, ...commandHandlers, ...queryHandlers],
})
export class UserModule {}
