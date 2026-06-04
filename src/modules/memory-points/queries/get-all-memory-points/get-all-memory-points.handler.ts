import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import type { PageDto } from '../../../../common/dto/page.dto.ts';
import type { MemoryPointDto } from '../../dtos/memory-point.dto.ts';
import { MemoryPointEntity } from '../../entities/memory-point.entity.ts';
import { GetAllMemoryPointsQuery } from './get-all-memory-points.query.ts';

@QueryHandler(GetAllMemoryPointsQuery)
export class GetAllMemoryPointsHandler
  implements IQueryHandler<GetAllMemoryPointsQuery, PageDto<MemoryPointDto>>
{
  constructor(
    @InjectRepository(MemoryPointEntity)
    private readonly memoryPointRepository: Repository<MemoryPointEntity>,
  ) {}

  async execute(
    query: GetAllMemoryPointsQuery,
  ): Promise<PageDto<MemoryPointDto>> {
    const { pageOptionsDto } = query;

    const queryBuilder = this.memoryPointRepository
      .createQueryBuilder('mp')
      .leftJoinAndSelect('mp.memoryPointDetails', 'details');

    if (pageOptionsDto.q) {
      queryBuilder.andWhere('details.title ILIKE :name', {
        name: `%${pageOptionsDto.q}%`,
      });
    }

    const [items, pageMetaDto] = await queryBuilder.paginate(pageOptionsDto);

    // eslint-disable-next-line sonarjs/argument-type
    return items.toPageDto(pageMetaDto);
  }
}
