import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { PageDto } from '../../../../common/dto/page.dto.ts';
import { MediaItemDto } from '../../dtos/media-item.dto.ts';
import { MemoryPointDetailsEntity } from '../../entities/memory-point-details.entity.ts';
import { GetMediaQuery } from './get-media.query.ts';

@QueryHandler(GetMediaQuery)
export class GetMediaHandler
  implements IQueryHandler<GetMediaQuery, PageDto<MediaItemDto>>
{
  constructor(
    @InjectRepository(MemoryPointDetailsEntity)
    private readonly detailsRepository: Repository<MemoryPointDetailsEntity>,
  ) {}

  async execute(query: GetMediaQuery): Promise<PageDto<MediaItemDto>> {
    const { pageOptionsDto } = query;

    const queryBuilder = this.detailsRepository
      .createQueryBuilder('details')
      .innerJoinAndSelect('details.memoryPoint', 'memoryPoint')
      .orderBy('details.createdAt', pageOptionsDto.order);

    if (pageOptionsDto.q) {
      queryBuilder.andWhere('details.title ILIKE :q', {
        q: `%${pageOptionsDto.q}%`,
      });
    }

    const [items, meta] = await queryBuilder.paginate(pageOptionsDto);

    const data = items.map((details) =>
      MediaItemDto.create({
        id: details.id,
        memoryPointId: details.memoryPointId,
        title: details.title ?? null,
        type: details.type,
        status: details.memoryPoint.status,
        photoUrl: details.sourcePhotoUrl,
        audioUrl: details.sourceAudioUrl,
        videoUrl: details.videoUrl ?? null,
        createdAt: details.createdAt,
      }),
    );

    return PageDto.create({ data, meta });
  }
}
