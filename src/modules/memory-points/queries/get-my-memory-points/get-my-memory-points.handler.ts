import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { PageDto } from '../../../../common/dto/page.dto.ts';
import { MyMemoryPointDto } from '../../dtos/my-memory-point.dto.ts';
import { MemoryPointEntity } from '../../entities/memory-point.entity.ts';
import { GetMyMemoryPointsQuery } from './get-my-memory-points.query.ts';

@QueryHandler(GetMyMemoryPointsQuery)
export class GetMyMemoryPointsHandler
  implements IQueryHandler<GetMyMemoryPointsQuery, PageDto<MyMemoryPointDto>>
{
  constructor(
    @InjectRepository(MemoryPointEntity)
    private readonly memoryPointRepository: Repository<MemoryPointEntity>,
  ) {}

  async execute(
    query: GetMyMemoryPointsQuery,
  ): Promise<PageDto<MyMemoryPointDto>> {
    const { userId, pageOptionsDto } = query;

    const queryBuilder = this.memoryPointRepository
      .createQueryBuilder('mp')
      .leftJoinAndSelect('mp.memoryPointDetails', 'details')
      .where('mp.userId = :userId', { userId });

    const [items, pageMetaDto] = await queryBuilder.paginate(pageOptionsDto);

    return PageDto.create({
      data: items.map((item) =>
        MyMemoryPointDto.create({
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
