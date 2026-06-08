import { Query } from '@nestjs/cqrs';

import type { DashboardStatsDto } from '../../dtos/dashboard-stats.dto.ts';

export class GetDashboardStatsQuery extends Query<DashboardStatsDto> {}
