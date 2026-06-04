import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import type { PageDto } from '../../../../common/dto/page.dto.ts';
import type { MemoryPointDto } from '../../dtos/memory-point.dto.ts';
import { MemoryPointEntity } from '../../entities/memory-point.entity.ts';
import { GetMyMemoryPointsQuery } from './get-my-memory-points.query.ts';

@QueryHandler(GetMyMemoryPointsQuery)
export class GetMyMemoryPointsHandler
  implements IQueryHandler<GetMyMemoryPointsQuery, PageDto<MemoryPointDto>>
{
  constructor(
    @InjectRepository(MemoryPointEntity)
    private readonly memoryPointRepository: Repository<MemoryPointEntity>,
  ) {}

  async execute(
    query: GetMyMemoryPointsQuery,
  ): Promise<PageDto<MemoryPointDto>> {
    const { userId, pageOptionsDto } = query;

    const queryBuilder = this.memoryPointRepository
      .createQueryBuilder('mp')
      .leftJoinAndSelect('mp.memoryPointDetails', 'details')
      .where('mp.userId = :userId', { userId });

    const [items, pageMetaDto] = await queryBuilder.paginate(pageOptionsDto);

    // eslint-disable-next-line sonarjs/argument-type
    return items.toPageDto(pageMetaDto);
  }
}
