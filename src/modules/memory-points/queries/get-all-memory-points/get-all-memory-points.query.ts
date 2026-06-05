import { Query } from '@nestjs/cqrs';

import type { PageDto } from '../../../../common/dto/page.dto.ts';
import type { PageOptionsDto } from '../../../../common/dto/page-options.dto.ts';
import type { MemoryPointDto } from '../../dtos/memory-point.dto.ts';

export class GetAllMemoryPointsQuery extends Query<PageDto<MemoryPointDto>> {
  constructor(public readonly pageOptionsDto: PageOptionsDto) {
    super();
  }
}
