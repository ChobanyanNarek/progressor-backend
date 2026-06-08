import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { MemoryPointModule } from '../memory-points/memory-point.module.ts';
import { UserModule } from '../user/user.module.ts';
import { AdminDashboardController } from './admin-dashboard.controller.ts';
import { AdminDashboardService } from './admin-dashboard.service.ts';
import { GetDashboardStatsHandler } from './queries/get-dashboard-stats/get-dashboard-stats.handler.ts';

const queryHandlers = [GetDashboardStatsHandler];

@Module({
  imports: [CqrsModule, UserModule, MemoryPointModule],
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService, ...queryHandlers],
})
export class AdminDashboardModule {}
