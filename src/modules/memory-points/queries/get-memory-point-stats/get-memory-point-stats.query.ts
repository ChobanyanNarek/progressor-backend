import { Query } from '@nestjs/cqrs';

import type { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';

export interface IMemoryPointStats {
  total: number;
  byStatus: Record<MemoryPointStatus, number>;
}

export class GetMemoryPointStatsQuery extends Query<IMemoryPointStats> {}
