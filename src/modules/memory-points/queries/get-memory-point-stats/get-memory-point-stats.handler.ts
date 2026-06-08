import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { MemoryPointEntity } from '../../entities/memory-point.entity.ts';
import {
  GetMemoryPointStatsQuery,
  type IMemoryPointStats,
} from './get-memory-point-stats.query.ts';

interface IStatusCountRow {
  status: MemoryPointStatus;
  count: string;
}

@QueryHandler(GetMemoryPointStatsQuery)
export class GetMemoryPointStatsHandler
  implements IQueryHandler<GetMemoryPointStatsQuery, IMemoryPointStats>
{
  constructor(
    @InjectRepository(MemoryPointEntity)
    private readonly memoryPointRepository: Repository<MemoryPointEntity>,
  ) {}

  async execute(): Promise<IMemoryPointStats> {
    const rows = await this.memoryPointRepository
      .createQueryBuilder('mp')
      .select('mp.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('mp.status')
      .getRawMany<IStatusCountRow>();

    const byStatus = Object.fromEntries(
      Object.values(MemoryPointStatus).map((status) => [status, 0]),
    ) as Record<MemoryPointStatus, number>;

    let total = 0;

    for (const row of rows) {
      const count = Number(row.count);
      byStatus[row.status] = count;
      total += count;
    }

    return { total, byStatus };
  }
}
