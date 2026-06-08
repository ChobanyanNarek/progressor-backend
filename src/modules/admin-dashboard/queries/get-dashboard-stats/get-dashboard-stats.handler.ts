import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { RoleType } from '../../../../constants/role-type.ts';
import { MemoryPointService } from '../../../memory-points/memory-point.service.ts';
import { UserService } from '../../../user/user.service.ts';
import { DashboardStatsDto } from '../../dtos/dashboard-stats.dto.ts';
import { MemoryPointStatusBreakdownDto } from '../../dtos/memory-point-status-breakdown.dto.ts';
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

    const { total: totalMemoryPoints, byStatus } = memoryPointStats;

    return DashboardStatsDto.create({
      totalUsers: userStats.total,
      totalCreators: userStats.byRole[RoleType.CREATOR],
      totalAdmins: userStats.byRole[RoleType.ADMIN],
      totalMemoryPoints,
      memoryPointsByStatus: MemoryPointStatusBreakdownDto.create({
        pending: byStatus[MemoryPointStatus.PENDING],
        adminReviewing: byStatus[MemoryPointStatus.ADMIN_REVIEWING],
        generating: byStatus[MemoryPointStatus.GENERATING],
        aiReviewing: byStatus[MemoryPointStatus.AI_REVIEWING],
        approved: byStatus[MemoryPointStatus.APPROVED],
        rejected: byStatus[MemoryPointStatus.REJECTED],
      }),
    });
  }
}
