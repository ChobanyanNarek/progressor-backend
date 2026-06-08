import { Query } from '@nestjs/cqrs';

import type { PageDto } from '../../../../common/dto/page.dto.ts';
import type { PageOptionsDto } from '../../../../common/dto/page-options.dto.ts';
import type { MyMemoryPointDto } from '../../dtos/my-memory-point.dto.ts';

export class GetMyMemoryPointsQuery extends Query<PageDto<MyMemoryPointDto>> {
  constructor(
    public readonly userId: Uuid,
    public readonly pageOptionsDto: PageOptionsDto,
  ) {
    super();
  }
}
