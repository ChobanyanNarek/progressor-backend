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
      items.map(async (details) =>
        MediaItemDto.create({
          id: details.id,
          memoryPointId: details.memoryPointId,
          title: details.title ?? null,
          type: details.type ?? null,
          status: details.memoryPoint.status,
          photoUrl: await this.signObjectPath(details.sourcePhotoUrl),
          audioUrl: await this.signObjectPath(details.sourceAudioUrl),
          videoUrl: await this.signObjectPath(details.videoUrl),
          createdAt: details.createdAt,
        }),
      ),
    );

    return PageDto.create({ data, meta });
  }

  /**
   * The columns store GCS *object paths*, not URLs — the bucket is private, so a
   * raw path 404s in the browser. Hand the client a short-lived signed read URL
   * it can actually load; pass through null/undefined (media not uploaded yet).
   */
  private signObjectPath(
    objectPath: string | null | undefined,
  ): Promise<string | null> {
    if (!objectPath) {
      return Promise.resolve(null);
    }

    return this.gcsService.getSignedReadUrl(objectPath);
  }
}
