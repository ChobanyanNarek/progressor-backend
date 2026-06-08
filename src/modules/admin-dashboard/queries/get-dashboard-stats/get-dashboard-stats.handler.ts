import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { MemoryPointService } from '../../../memory-points/memory-point.service.ts';
import { UserService } from '../../../user/user.service.ts';
import { DashboardStatsDto } from '../../dtos/dashboard-stats.dto.ts';
import { GetDashboardStatsQuery } from './get-dashboard-stats.query.ts';

@QueryHandler(GetDashboardStatsQuery)
export class GetDashboardStatsHandler
  implements IQueryHandler<GetDashboardStatsQuery, DashboardStatsDto>
{
  constructor(
    private readonly userService: UserService,
    private readonly memoryPointService: MemoryPointService,
  ) {}

  async execute(): Promise<DashboardStatsDto> {
    const [userStats, memoryPointStats] = await Promise.all([
      this.userService.getStats(),
      this.memoryPointService.getStats(),
    ]);

    return DashboardStatsDto.create({
      totalUsers: userStats.total,
      totalCreators: userStats.byRole.creator,
      totalAdmins: userStats.byRole.admin,
      totalMemoryPoints: memoryPointStats.total,
      memoryPointsByStatus: memoryPointStats.byStatus,
    });
  }
}
