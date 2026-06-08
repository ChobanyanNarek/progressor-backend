import { Query } from '@nestjs/cqrs';

import type { PageDto } from '../../../../common/dto/page.dto.ts';
import type { NearbyMemoryPointDto } from '../../dtos/nearby-memory-point.dto.ts';
import type { NearbyMemoryPointsPageOptionsDto } from '../../dtos/nearby-memory-points-page-options.dto.ts';

export class GetNearbyMemoryPointsQuery extends Query<
  PageDto<NearbyMemoryPointDto>
> {
  constructor(
    public readonly pageOptionsDto: NearbyMemoryPointsPageOptionsDto,
  ) {
    super();
  }
}
