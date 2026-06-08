import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { RoleType } from '../../constants/role-type.ts';
import { Auth } from '../../decorators/http.decorators.ts';
import { AdminDashboardService } from './admin-dashboard.service.ts';
import { DashboardStatsDto } from './dtos/dashboard-stats.dto.ts';
import { RecentMemoryPointDto } from './dtos/recent-memory-point.dto.ts';
import { RecentPointsOptionsDto } from './dtos/recent-points-options.dto.ts';

@Controller('admin/dashboard')
@ApiTags('admin-dashboard')
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get('stats')
  @Auth([RoleType.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get aggregated dashboard statistics' })
  @ApiOkResponse({
    // eslint-disable-next-line awesome-nest/unique-endpoint-dtos
    type: DashboardStatsDto,
  })
  getStats(): Promise<DashboardStatsDto> {
    return this.dashboardService.getStats();
  }

  @Get('recent-points')
  @Auth([RoleType.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get the most recently created memory points' })
  @ApiOkResponse({
    // eslint-disable-next-line awesome-nest/unique-endpoint-dtos
    type: RecentMemoryPointDto,
    isArray: true,
  })
  getRecentPoints(
    @Query(new ValidationPipe({ transform: true }))
    options: RecentPointsOptionsDto,
  ): Promise<RecentMemoryPointDto[]> {
    return this.dashboardService.getRecentMemoryPoints(options.limit);
  }
}
