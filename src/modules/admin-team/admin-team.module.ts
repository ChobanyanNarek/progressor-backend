import { Module } from '@nestjs/common';

import { UserModule } from '../user/user.module.ts';
import { AdminTeamController } from './admin-team.controller.ts';
import { AdminTeamService } from './admin-team.service.ts';

@Module({
  imports: [UserModule],
  controllers: [AdminTeamController],
  providers: [AdminTeamService],
})
export class AdminTeamModule {}
