import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { PageDto } from '../../../../common/dto/page.dto.ts';
import { escapeLikePattern } from '../../../../common/utils.ts';
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
     * Escape LIKE metacharacters (% _ \) in the user term so they match
     * literally — otherwise a `%` matches everything and `_` any character.
     * A missing term lists the APPROVED set (wrapped in `%…%` → `%%`).
     */
    const escapedTerm = `%${escapeLikePattern(pageOptionsDto.q ?? '')}%`;

    const queryBuilder = this.memoryPointRepository
      .createQueryBuilder('mp')
      .leftJoinAndSelect('mp.memoryPointDetails', 'details')
      .where('mp.status = :status', { status: MemoryPointStatus.APPROVED })
      /*
       * NOTE(TICKET-07): when the publication lifecycle lands, also constrain
       * `mp.publicationState = ACTIVE` so archived/inactive points stay hidden.
       */
      .andWhere(String.raw`details.title ILIKE :q ESCAPE '\'`, {
        q: escapedTerm,
      })
      .orderBy('details.title', pageOptionsDto.order)
      // Stable tiebreaker so pagination is deterministic across duplicate titles.
      .addOrderBy('mp.id', 'ASC');

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
