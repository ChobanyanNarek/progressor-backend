import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { RoleType } from '../../../../constants/role-type.ts';
import type { MemoryPointService } from '../../../memory-points/memory-point.service.ts';
import type { UserService } from '../../../user/user.service.ts';
import { GetDashboardStatsHandler } from './get-dashboard-stats.handler.ts';

describe('GetDashboardStatsHandler', () => {
  let handler: GetDashboardStatsHandler;
  let userGetStats: jest.Mock;
  let mpGetStats: jest.Mock;

  beforeEach(() => {
    userGetStats = jest.fn<() => Promise<unknown>>().mockResolvedValue({
      total: 10,
      byRole: { [RoleType.CREATOR]: 7, [RoleType.ADMIN]: 3 },
    });
    mpGetStats = jest.fn<() => Promise<unknown>>().mockResolvedValue({
      total: 5,
      byStatus: {
        [MemoryPointStatus.PENDING]: 2,
        [MemoryPointStatus.ADMIN_REVIEWING]: 1,
        [MemoryPointStatus.GENERATING]: 0,
        [MemoryPointStatus.AI_REVIEWING]: 0,
        [MemoryPointStatus.APPROVED]: 2,
        [MemoryPointStatus.REJECTED]: 0,
      },
    });

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
