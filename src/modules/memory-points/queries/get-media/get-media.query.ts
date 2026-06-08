import { Query } from '@nestjs/cqrs';

import type { PageDto } from '../../../../common/dto/page.dto.ts';
import type { PageOptionsDto } from '../../../../common/dto/page-options.dto.ts';
import type { MediaItemDto } from '../../dtos/media-item.dto.ts';

export class GetMediaQuery extends Query<PageDto<MediaItemDto>> {
  constructor(public readonly pageOptionsDto: PageOptionsDto) {
    super();
  }
}
