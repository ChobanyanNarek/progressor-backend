import { Query } from '@nestjs/cqrs';

import type { PageDto } from '../../../../common/dto/page.dto.ts';
import type { PageOptionsDto } from '../../../../common/dto/page-options.dto.ts';
import type { AdminMemoryPointListItemDto } from '../../dtos/admin-memory-point-list-item.dto.ts';

export class GetAllMemoryPointsQuery extends Query<
  PageDto<AdminMemoryPointListItemDto>
> {
  constructor(public readonly pageOptionsDto: PageOptionsDto) {
    super();
  }
}
