import { Query } from '@nestjs/cqrs';

import type { PageDto } from '../../../../common/dto/page.dto.ts';
import type { AdminLogEntryDto } from '../../dtos/admin-log-entry.dto.ts';
import type { AdminLogOptionsDto } from '../../dtos/admin-log-options.dto.ts';

export class GetAdminLogsQuery extends Query<PageDto<AdminLogEntryDto>> {
  constructor(public readonly optionsDto: AdminLogOptionsDto) {
    super();
  }
}
