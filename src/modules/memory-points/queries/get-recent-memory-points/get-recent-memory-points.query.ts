import { Query } from '@nestjs/cqrs';

import type { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';

export interface IRecentMemoryPoint {
  id: Uuid;
  title: string | null;
  status: MemoryPointStatus;
  createdAt: Date;
}

export class GetRecentMemoryPointsQuery extends Query<IRecentMemoryPoint[]> {
  constructor(public readonly limit: number) {
    super();
  }
}
