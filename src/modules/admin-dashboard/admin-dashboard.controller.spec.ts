import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { MemoryPointStatus } from '../../constants/memory-point-status.ts';
import { AdminDashboardController } from './admin-dashboard.controller.ts';
import type { AdminDashboardService } from './admin-dashboard.service.ts';
import { DashboardStatsDto } from './dtos/dashboard-stats.dto.ts';
import { MemoryPointStatusBreakdownDto } from './dtos/memory-point-status-breakdown.dto.ts';
import { RecentMemoryPointDto } from './dtos/recent-memory-point.dto.ts';
import type { RecentPointsOptionsDto } from './dtos/recent-points-options.dto.ts';

describe('AdminDashboardController', () => {
  let controller: AdminDashboardController;
  let getStats: jest.Mock;
  let getRecentMemoryPoints: jest.Mock;

  beforeEach(() => {
    const stats = DashboardStatsDto.create({
      totalUsers: 10,
      totalCreators: 7,
      totalAdmins: 3,
      totalMemoryPoints: 5,
      memoryPointsByStatus: MemoryPointStatusBreakdownDto.create({
        pending: 2,
        adminReviewing: 1,
        generating: 0,
        aiReviewing: 0,
        approved: 2,
        rejected: 0,
      }),
    });
    getStats = jest.fn<() => Promise<unknown>>().mockResolvedValue(stats);
    getRecentMemoryPoints = jest
      .fn<() => Promise<unknown>>()
      .mockResolvedValue([
        RecentMemoryPointDto.create({
          id: '11111111-1111-4111-8111-111111111111' as Uuid,
          title: 'Grandpa',
          status: MemoryPointStatus.PENDING,
          createdAt: new Date('2026-01-05T00:00:00.000Z'),
        }),
      ]);

    controller = new AdminDashboardController({
      getStats,
      getRecentMemoryPoints,
    } as unknown as AdminDashboardService);
  });

  it('returns aggregated stats', async () => {
    const result = await controller.getStats();

    expect(getStats).toHaveBeenCalledTimes(1);
    expect(result.totalUsers).toBe(10);
    expect(result.memoryPointsByStatus.pending).toBe(2);
  });

  it('passes the requested limit through to the service', async () => {
    const result = await controller.getRecentPoints({
      limit: 5,
    } as RecentPointsOptionsDto);

    expect(getRecentMemoryPoints).toHaveBeenCalledWith(5);
    expect(result[0]!.title).toBe('Grandpa');
  });
});
