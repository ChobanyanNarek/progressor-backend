import { Query } from '@nestjs/cqrs';

import type { PageDto } from '../../../../common/dto/page.dto.ts';
import type { ReleaseNoteTaskDto } from '../../dtos/release-note-task.dto.ts';
import type { ReleaseNoteTasksPageOptionsDto } from '../../dtos/release-note-tasks-page-options.dto.ts';

export class ReleaseNoteTasksQuery extends Query<PageDto<ReleaseNoteTaskDto>> {
  constructor(
    public readonly userId: Uuid,
    public readonly pageOptionsDto: ReleaseNoteTasksPageOptionsDto,
  ) {
    super();
  }
}
