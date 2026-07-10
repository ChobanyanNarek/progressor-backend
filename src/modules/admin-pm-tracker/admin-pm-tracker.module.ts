import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PmTrackerStateEntity } from '../pm-tracker/pm-tracker-state.entity.ts';
import { DeleteUserHandler } from '../user/commands/delete-user/delete-user.handler.ts';
import { UserEntity } from '../user/user.entity.ts';
import { AdminPmTrackerController } from './admin-pm-tracker.controller.ts';
import { AdminPmTrackerService } from './admin-pm-tracker.service.ts';
import { AdminChangePasswordHandler } from './commands/admin-change-password/admin-change-password.handler.ts';
import { DeleteUserDataHandler } from './commands/delete-user-data/delete-user-data.handler.ts';
import { GetAdminUsersHandler } from './queries/get-admin-users/get-admin-users.handler.ts';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([UserEntity, PmTrackerStateEntity]),
  ],
  controllers: [AdminPmTrackerController],
  providers: [
    AdminPmTrackerService,
    GetAdminUsersHandler,
    AdminChangePasswordHandler,
    DeleteUserDataHandler,
    DeleteUserHandler,
  ],
})
export class AdminPmTrackerModule {}
