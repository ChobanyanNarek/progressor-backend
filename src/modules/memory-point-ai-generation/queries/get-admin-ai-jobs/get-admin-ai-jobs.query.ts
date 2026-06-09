import { Query } from '@nestjs/cqrs';

import type { PageDto } from '../../../../common/dto/page.dto.ts';
import type { AdminAiJobDto } from '../../dtos/admin-ai-job.dto.ts';
import type { AdminAiJobOptionsDto } from '../../dtos/admin-ai-job-options.dto.ts';

export class GetAdminAiJobsQuery extends Query<PageDto<AdminAiJobDto>> {
  constructor(public readonly pageOptionsDto: AdminAiJobOptionsDto) {
    super();
  }
}
