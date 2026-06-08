import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { MemoryPointStatsDto } from '../../../memory-points/dtos/memory-point-stats.dto.ts';
import { MemoryPointStatusBreakdownDto } from '../../../memory-points/dtos/memory-point-status-breakdown.dto.ts';
import type { MemoryPointService } from '../../../memory-points/memory-point.service.ts';
import { UserRoleBreakdownDto } from '../../../user/dtos/user-role-breakdown.dto.ts';
import { UserStatsDto } from '../../../user/dtos/user-stats.dto.ts';
import type { UserService } from '../../../user/user.service.ts';
import { GetDashboardStatsHandler } from './get-dashboard-stats.handler.ts';

describe('GetDashboardStatsHandler', () => {
  let handler: GetDashboardStatsHandler;
  let userGetStats: jest.Mock;
  let mpGetStats: jest.Mock;

  beforeEach(() => {
    userGetStats = jest.fn<() => Promise<unknown>>().mockResolvedValue(
      UserStatsDto.create({
        total: 10,
        byRole: UserRoleBreakdownDto.create({ creator: 7, admin: 3 }),
      }),
    );
    mpGetStats = jest.fn<() => Promise<unknown>>().mockResolvedValue(
      MemoryPointStatsDto.create({
        total: 5,
        byStatus: MemoryPointStatusBreakdownDto.create({
          pending: 2,
          adminReviewing: 1,
          generating: 0,
          aiReviewing: 0,
          approved: 2,
          rejected: 0,
        }),
      }),
    );

    handler = new GetDashboardStatsHandler(
      { getStats: userGetStats } as unknown as UserService,
      { getStats: mpGetStats } as unknown as MemoryPointService,
    );
  });

  it('composes user and memory-point stats into the dashboard DTO', async () => {
    const result = await handler.execute();

    expect(result.totalUsers).toBe(10);
    expect(result.totalCreators).toBe(7);
    expect(result.totalAdmins).toBe(3);
    expect(result.totalMemoryPoints).toBe(5);
    expect(result.memoryPointsByStatus.pending).toBe(2);
    expect(result.memoryPointsByStatus.adminReviewing).toBe(1);
    expect(result.memoryPointsByStatus.approved).toBe(2);
    expect(result.memoryPointsByStatus.rejected).toBe(0);
  });
});
