import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { RecentMemoryPointDto } from '../../dtos/recent-memory-point.dto.ts';
import { MemoryPointEntity } from '../../entities/memory-point.entity.ts';
import { GetRecentMemoryPointsQuery } from './get-recent-memory-points.query.ts';

@QueryHandler(GetRecentMemoryPointsQuery)
export class GetRecentMemoryPointsHandler
  implements IQueryHandler<GetRecentMemoryPointsQuery, RecentMemoryPointDto[]>
{
  constructor(
    @InjectRepository(MemoryPointEntity)
    private readonly memoryPointRepository: Repository<MemoryPointEntity>,
  ) {}

  async execute(
    query: GetRecentMemoryPointsQuery,
  ): Promise<RecentMemoryPointDto[]> {
    const items = await this.memoryPointRepository
      .createQueryBuilder('mp')
      .leftJoin('mp.memoryPointDetails', 'details')
      .select(['mp.id', 'mp.status', 'mp.createdAt', 'details.title'])
      .orderBy('mp.createdAt', 'DESC')
      .take(query.limit)
      .getMany();

    return items.map((mp) =>
      RecentMemoryPointDto.create({
        id: mp.id,
        title: mp.memoryPointDetails?.title ?? null,
        status: mp.status,
        createdAt: mp.createdAt,
      }),
    );
  }
}
