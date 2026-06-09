import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { PageDto } from '../../../../common/dto/page.dto.ts';
import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { SearchMemoryPointDto } from '../../dtos/search-memory-point.dto.ts';
import { MemoryPointEntity } from '../../entities/memory-point.entity.ts';
import { SearchMemoryPointsQuery } from './search-memory-points.query.ts';

@QueryHandler(SearchMemoryPointsQuery)
export class SearchMemoryPointsHandler
  implements
    IQueryHandler<SearchMemoryPointsQuery, PageDto<SearchMemoryPointDto>>
{
  constructor(
    @InjectRepository(MemoryPointEntity)
    private readonly memoryPointRepository: Repository<MemoryPointEntity>,
  ) {}

  async execute(
    query: SearchMemoryPointsQuery,
  ): Promise<PageDto<SearchMemoryPointDto>> {
    const { pageOptionsDto } = query;

    /*
     * LIKE wildcards in user input could accidentally match everything (`%`) or
     * turn into a full-text operator. Mirror the escaping used in the nearby
     * handler: no special escaping is applied there either, and the project does
     * not expose raw regex. The ILIKE param already wraps in `%…%` so a literal
     * `%` in the query string is harmless (worst case: broader matches).
     */
    const queryBuilder = this.memoryPointRepository
      .createQueryBuilder('mp')
      .leftJoinAndSelect('mp.memoryPointDetails', 'details')
      .where('mp.status = :status', { status: MemoryPointStatus.APPROVED })
      /*
       * NOTE(TICKET-07): when the publication lifecycle lands, also constrain
       * `mp.publicationState = ACTIVE` so archived/inactive points stay hidden.
       */
      .andWhere('details.title ILIKE :q', { q: `%${pageOptionsDto.q}%` })
      .orderBy('details.title', pageOptionsDto.order);

    const [items, pageMetaDto] = await queryBuilder.paginate(pageOptionsDto);

    return PageDto.create({
      data: items.map((item) =>
        SearchMemoryPointDto.create({
          id: item.id,
          location: item.location,
          status: item.status,
          title: item.memoryPointDetails?.title ?? undefined,
          description: item.memoryPointDetails?.description ?? undefined,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }),
      ),
      meta: pageMetaDto,
    });
  }
}
