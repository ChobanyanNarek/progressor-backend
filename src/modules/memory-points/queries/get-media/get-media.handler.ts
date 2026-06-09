import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { PageDto } from '../../../../common/dto/page.dto.ts';
import { escapeLikePattern } from '../../../../common/utils.ts';
import { GcsStorageService } from '../../../../shared/services/gcs-storage.service.ts';
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
    private readonly gcsService: GcsStorageService,
  ) {}

  async execute(query: GetMediaQuery): Promise<PageDto<MediaItemDto>> {
    const { pageOptionsDto } = query;

    const queryBuilder = this.detailsRepository
      .createQueryBuilder('details')
      .innerJoinAndSelect('details.memoryPoint', 'memoryPoint')
      .orderBy('details.createdAt', pageOptionsDto.order);

    if (pageOptionsDto.q) {
      queryBuilder.andWhere('details.title ILIKE :q', {
        q: `%${escapeLikePattern(pageOptionsDto.q)}%`,
      });
    }

    const [items, meta] = await queryBuilder.paginate(pageOptionsDto);

    const data = await Promise.all(
      items.map(async (details) => {
        /*
         * Columns store GCS object paths, not URLs — the bucket is private, so a
         * raw path 404s in the browser. Sign the three concurrently (each is an
         * IAM signBlob round-trip; serial awaits would triple per-row latency).
         */
        const [photoUrl, audioUrl, videoUrl] = await Promise.all([
          this.gcsService.getSignedReadUrlOrNull(details.sourcePhotoUrl),
          this.gcsService.getSignedReadUrlOrNull(details.sourceAudioUrl),
          this.gcsService.getSignedReadUrlOrNull(details.videoUrl),
        ]);

        return MediaItemDto.create({
          id: details.id,
          memoryPointId: details.memoryPointId,
          title: details.title ?? null,
          type: details.type ?? null,
          status: details.memoryPoint.status,
          photoUrl,
          audioUrl,
          videoUrl,
          createdAt: details.createdAt,
        });
      }),
    );

    return PageDto.create({ data, meta });
  }
}
