import { Query } from '@nestjs/cqrs';

import type { PageDto } from '../../../../common/dto/page.dto.ts';
import type { SearchMemoryPointDto } from '../../dtos/search-memory-point.dto.ts';
import type { SearchMemoryPointsPageOptionsDto } from '../../dtos/search-memory-points-page-options.dto.ts';

export class SearchMemoryPointsQuery extends Query<
  PageDto<SearchMemoryPointDto>
> {
  constructor(
    public readonly pageOptionsDto: SearchMemoryPointsPageOptionsDto,
  ) {
    super();
  }
}
