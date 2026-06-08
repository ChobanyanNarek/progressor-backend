import { Query } from '@nestjs/cqrs';

import type { MemoryPointStatsDto } from '../../dtos/memory-point-stats.dto.ts';

export class GetMemoryPointStatsQuery extends Query<MemoryPointStatsDto> {}
