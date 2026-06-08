import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { MemoryPointService } from '../memory-points/memory-point.service.ts';
import type { DashboardStatsDto } from './dtos/dashboard-stats.dto.ts';
import { RecentMemoryPointDto } from './dtos/recent-memory-point.dto.ts';
import { RecentMemoryPointsDto } from './dtos/recent-memory-points.dto.ts';
import { GetDashboardStatsQuery } from './queries/get-dashboard-stats/get-dashboard-stats.query.ts';

@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly memoryPointService: MemoryPointService,
  ) {}

  getStats(): Promise<DashboardStatsDto> {
    return this.queryBus.execute<GetDashboardStatsQuery, DashboardStatsDto>(
      new GetDashboardStatsQuery(),
    );
  }

  async getRecentMemoryPoints(limit: number): Promise<RecentMemoryPointsDto> {
    const points = await this.memoryPointService.getRecent(limit);

    return RecentMemoryPointsDto.create({
      items: points.map((point) =>
        RecentMemoryPointDto.create({
          id: point.id,
          title: point.title,
          status: point.status,
          createdAt: point.createdAt,
        }),
      ),
    });
  }
}
