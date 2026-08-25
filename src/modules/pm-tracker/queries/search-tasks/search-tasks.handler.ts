import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { PageDto } from '../../../../common/dto/page.dto.ts';
import { escapeLikePattern } from '../../../../common/utils.ts';
import { PmTrackerTaskDto } from '../../dtos/pm-tracker-task.dto.ts';
import { PmTrackerTaskEntity } from '../../entities/pm-tracker-task.entity.ts';
import { SearchTasksQuery } from './search-tasks.query.ts';

@QueryHandler(SearchTasksQuery)
export class SearchTasksHandler
  implements IQueryHandler<SearchTasksQuery, PageDto<PmTrackerTaskDto>>
{
  constructor(
    @InjectRepository(PmTrackerTaskEntity)
    private readonly taskRepository: Repository<PmTrackerTaskEntity>,
  ) {}

  async execute(query: SearchTasksQuery): Promise<PageDto<PmTrackerTaskDto>> {
    const { userId, pageOptionsDto } = query;

    const queryBuilder = this.taskRepository
      .createQueryBuilder('t')
      .where('t.user_id = :userId', { userId });

    if (pageOptionsDto.projectId) {
      queryBuilder.andWhere('t.project_id = :projectId', {
        projectId: pageOptionsDto.projectId,
      });
    }

    if (pageOptionsDto.status) {
      queryBuilder.andWhere('t.status = :status', {
        status: pageOptionsDto.status,
      });
    }

    if (pageOptionsDto.q) {
      /*
       * Escape LIKE metacharacters (% _ \) in the user term so they match
       * literally. Matches task title/comment directly, and each embedded
       * Jira issue's name/url via jsonb_array_elements — there's no join
       * target since jiras lives on the same row as jsonb, not a child table.
       */
      const escapedTerm = `%${escapeLikePattern(pageOptionsDto.q)}%`;

      queryBuilder.andWhere(
        String.raw`(
          t.title ILIKE :q ESCAPE '\'
          OR t.comment ILIKE :q ESCAPE '\'
          OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(t.jiras) AS issue
            WHERE (issue ->> 'name') ILIKE :q ESCAPE '\'
               OR (issue ->> 'url') ILIKE :q ESCAPE '\'
          )
        )`,
        { q: escapedTerm },
      );
    }

    queryBuilder
      .orderBy('t.date', pageOptionsDto.order)
      // Stable tiebreaker so pagination is deterministic across same-date tasks.
      .addOrderBy('t.id', 'ASC');

    const [items, pageMetaDto] = await queryBuilder.paginate(pageOptionsDto);

    return PageDto.create({
      data: items.map((item) => item.toDto()),
      meta: pageMetaDto,
    });
  }
}
