import { Query } from '@nestjs/cqrs';

import type { PageDto } from '../../../../common/dto/page.dto.ts';
import type { PmTrackerTaskDto } from '../../dtos/pm-tracker-task.dto.ts';
import type { SearchTasksPageOptionsDto } from '../../dtos/search-tasks-page-options.dto.ts';

export class SearchTasksQuery extends Query<PageDto<PmTrackerTaskDto>> {
  constructor(
    public readonly userId: Uuid,
    public readonly pageOptionsDto: SearchTasksPageOptionsDto,
  ) {
    super();
  }
}
