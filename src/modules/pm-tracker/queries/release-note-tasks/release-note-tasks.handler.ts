import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { PageDto } from '../../../../common/dto/page.dto.ts';
import { ReleaseNoteTaskDto } from '../../dtos/release-note-task.dto.ts';
import { PmTrackerTaskEntity } from '../../entities/pm-tracker-task.entity.ts';
import { ReleaseNoteTasksQuery } from './release-note-tasks.query.ts';

@QueryHandler(ReleaseNoteTasksQuery)
export class ReleaseNoteTasksHandler
  implements IQueryHandler<ReleaseNoteTasksQuery, PageDto<ReleaseNoteTaskDto>>
{
  constructor(
    @InjectRepository(PmTrackerTaskEntity)
    private readonly taskRepository: Repository<PmTrackerTaskEntity>,
  ) {}

  async execute(
    query: ReleaseNoteTasksQuery,
  ): Promise<PageDto<ReleaseNoteTaskDto>> {
    const { userId, pageOptionsDto } = query;

    const queryBuilder = this.taskRepository
      .createQueryBuilder('t')
      .where('t.user_id = :userId', { userId });

    if (pageOptionsDto.projectId) {
      queryBuilder.andWhere('t.project_id = :projectId', {
        projectId: pageOptionsDto.projectId,
      });
    }

    if (pageOptionsDto.dateFrom) {
      queryBuilder.andWhere('t.date >= :dateFrom', {
        dateFrom: pageOptionsDto.dateFrom,
      });
    }

    if (pageOptionsDto.dateTo) {
      queryBuilder.andWhere('t.date <= :dateTo', {
        dateTo: pageOptionsDto.dateTo,
      });
    }

    queryBuilder
      .orderBy('t.date', pageOptionsDto.order)
      .addOrderBy('t.id', 'ASC');

    const [items, pageMetaDto] = await queryBuilder.paginate(pageOptionsDto);

    return PageDto.create({
      data: items.map((item) => ReleaseNoteTaskDto.create(item)),
      meta: pageMetaDto,
    });
  }
}
