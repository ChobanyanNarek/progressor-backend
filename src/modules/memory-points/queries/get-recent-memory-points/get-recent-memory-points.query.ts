import { Query } from '@nestjs/cqrs';

import type { RecentMemoryPointDto } from '../../dtos/recent-memory-point.dto.ts';

export class GetRecentMemoryPointsQuery extends Query<RecentMemoryPointDto[]> {
  constructor(public readonly limit: number) {
    super();
  }
}
