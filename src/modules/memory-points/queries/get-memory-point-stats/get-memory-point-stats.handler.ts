import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { MemoryPointStatsDto } from '../../dtos/memory-point-stats.dto.ts';
import { MemoryPointStatusBreakdownDto } from '../../dtos/memory-point-status-breakdown.dto.ts';
import { MemoryPointEntity } from '../../entities/memory-point.entity.ts';
import { GetMemoryPointStatsQuery } from './get-memory-point-stats.query.ts';

interface IStatusCountRow {
  status: MemoryPointStatus;
  count: string;
}

@QueryHandler(GetMemoryPointStatsQuery)
export class GetMemoryPointStatsHandler
  implements IQueryHandler<GetMemoryPointStatsQuery, MemoryPointStatsDto>
{
  constructor(
    @InjectRepository(MemoryPointEntity)
    private readonly memoryPointRepository: Repository<MemoryPointEntity>,
  ) {}

  async execute(): Promise<MemoryPointStatsDto> {
    const rows = await this.memoryPointRepository
      .createQueryBuilder('mp')
      .select('mp.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('mp.status')
      .getRawMany<IStatusCountRow>();

    const counts = Object.fromEntries(
      Object.values(MemoryPointStatus).map((status) => [status, 0]),
    ) as Record<MemoryPointStatus, number>;

    let total = 0;

    for (const row of rows) {
      const count = Number(row.count);
      counts[row.status] = count;
      total += count;
    }

    return MemoryPointStatsDto.create({
      total,
      byStatus: MemoryPointStatusBreakdownDto.create({
        pending: counts[MemoryPointStatus.PENDING],
        adminReviewing: counts[MemoryPointStatus.ADMIN_REVIEWING],
        generating: counts[MemoryPointStatus.GENERATING],
        aiReviewing: counts[MemoryPointStatus.AI_REVIEWING],
        approved: counts[MemoryPointStatus.APPROVED],
        rejected: counts[MemoryPointStatus.REJECTED],
      }),
    });
  }
}
