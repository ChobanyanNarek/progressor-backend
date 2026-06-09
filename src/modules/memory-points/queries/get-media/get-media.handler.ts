import { Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(GetMediaHandler.name);

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
         * Sign the three object paths concurrently — each is an IAM signBlob
         * round-trip, so serial awaits would triple the latency per row.
         */
        const [photoUrl, audioUrl, videoUrl] = await Promise.all([
          this.signObjectPath(details.sourcePhotoUrl),
          this.signObjectPath(details.sourceAudioUrl),
          this.signObjectPath(details.videoUrl),
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

  /**
   * The columns store GCS *object paths*, not URLs — the bucket is private, so a
   * raw path 404s in the browser. Hand the client a short-lived signed read URL
   * it can actually load; pass through null/undefined (media not uploaded yet).
   *
   * A signing failure degrades to null (that one asset won't load) rather than
   * 500-ing the whole gallery — one bad object path shouldn't blank the page.
   */
  private async signObjectPath(
    objectPath: string | null | undefined,
  ): Promise<string | null> {
    if (!objectPath) {
      return null;
    }

    try {
      return await this.gcsService.getSignedReadUrl(objectPath);
    } catch (error) {
      this.logger.error(`Failed to sign read URL for ${objectPath}`, error);

      return null;
    }
  }
}
