import { Query } from '@nestjs/cqrs';

import type { PageDto } from '../../../../common/dto/page.dto.ts';
import type { PageOptionsDto } from '../../../../common/dto/page-options.dto.ts';
import type { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import type { MemoryPointType } from '../../../../constants/memory-point-type.ts';

/**
 * Flat projection of a memory point's media bundle. There is no media table;
 * assets are GCS object paths persisted on `memory_point_details`. URLs are
 * returned as stored (object paths / re-hosted video URL), matching the
 * existing `MemoryPointDetailsDto` contract.
 */
export interface IMediaItem {
  id: Uuid;
  memoryPointId: Uuid;
  title: string | null;
  type: MemoryPointType;
  status: MemoryPointStatus;
  photoUrl: string;
  audioUrl: string;
  videoUrl: string | null;
  createdAt: Date;
}

export class GetMediaQuery extends Query<PageDto<IMediaItem>> {
  constructor(public readonly pageOptionsDto: PageOptionsDto) {
    super();
  }
}
