import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { PageDto } from '../../../../common/dto/page.dto.ts';
import { AdminMemoryPointListItemDto } from '../../dtos/admin-memory-point-list-item.dto.ts';
import { MemoryPointEntity } from '../../entities/memory-point.entity.ts';
import { GetAllMemoryPointsQuery } from './get-all-memory-points.query.ts';

@QueryHandler(GetAllMemoryPointsQuery)
export class GetAllMemoryPointsHandler
  implements
    IQueryHandler<GetAllMemoryPointsQuery, PageDto<AdminMemoryPointListItemDto>>
{
  constructor(
    @InjectRepository(MemoryPointEntity)
    private readonly memoryPointRepository: Repository<MemoryPointEntity>,
  ) {}

  async execute(
    query: GetAllMemoryPointsQuery,
  ): Promise<PageDto<AdminMemoryPointListItemDto>> {
    const { pageOptionsDto } = query;

    const queryBuilder = this.memoryPointRepository
      .createQueryBuilder('mp')
      .leftJoinAndSelect('mp.memoryPointDetails', 'details')
      .orderBy('mp.createdAt', pageOptionsDto.order);

    if (pageOptionsDto.q) {
      queryBuilder.andWhere('details.title ILIKE :name', {
        name: `%${pageOptionsDto.q}%`,
      });
    }

    const [items, pageMetaDto] = await queryBuilder.paginate(pageOptionsDto);

    return PageDto.create({
      data: items.map((item) =>
        AdminMemoryPointListItemDto.create({
          id: item.id,
          location: item.location,
          status: item.status,
          title: item.memoryPointDetails?.title,
          description: item.memoryPointDetails?.description,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }),
      ),
      meta: pageMetaDto,
    });
  }
}
