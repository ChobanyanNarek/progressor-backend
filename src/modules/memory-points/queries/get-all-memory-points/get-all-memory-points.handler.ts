import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { PageDto } from '../../../../common/dto/page.dto.ts';
import { escapeLikePattern } from '../../../../common/utils.ts';
import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { GcsStorageService } from '../../../../shared/services/gcs-storage.service.ts';
import { AdminMemoryPointListItemDto } from '../../dtos/admin-memory-point-list-item.dto.ts';
import { CreatorSummaryDto } from '../../dtos/creator-summary.dto.ts';
import { MemoryPointEntity } from '../../entities/memory-point.entity.ts';
import { GetAllMemoryPointsQuery } from './get-all-memory-points.query.ts';

@QueryHandler(GetAllMemoryPointsQuery)
export class GetAllMemoryPointsHandler
  implements
    IQueryHandler<GetAllMemoryPointsQuery, PageDto<AdminMemoryPointListItemDto>>
{
  constructor(
    @InjectRepository(MemoryPointEntity)
    private readonly memoryPointRepository: Repository<MemoryPointEntity>,
    private readonly gcsService: GcsStorageService,
  ) {}

  async execute(
    query: GetAllMemoryPointsQuery,
  ): Promise<PageDto<AdminMemoryPointListItemDto>> {
    const { pageOptionsDto } = query;

    const queryBuilder = this.memoryPointRepository
      .createQueryBuilder('mp')
      .leftJoinAndSelect('mp.memoryPointDetails', 'details')
      .leftJoinAndSelect('mp.user', 'user')
      /*
       * PENDING points are creator-private drafts (details not yet submitted).
       * Admin only sees points from ADMIN_REVIEWING onward, once completed.
       */
      .where('mp.status != :draftStatus', {
        draftStatus: MemoryPointStatus.PENDING,
      })
      .orderBy('mp.createdAt', pageOptionsDto.order);

    if (pageOptionsDto.q) {
      queryBuilder.andWhere('details.title ILIKE :name', {
        name: `%${escapeLikePattern(pageOptionsDto.q)}%`,
      });
    }

    const [items, pageMetaDto] = await queryBuilder.paginate(pageOptionsDto);

    /*
     * photoUrl is a GCS object path (private bucket) — a raw path 404s in the
     * browser, so sign each into a short-lived read URL the thumbnail can load.
     * One signed read per row, run concurrently across the page.
     */
    const data = await Promise.all(
      items.map(async (item) =>
        AdminMemoryPointListItemDto.create({
          id: item.id,
          userId: item.userId,
          location: item.location,
          status: item.status,
          type: item.memoryPointDetails?.type ?? undefined,
          title: item.memoryPointDetails?.title,
          description: item.memoryPointDetails?.description,
          photoUrl: await this.gcsService.getSignedReadUrlOrNull(
            item.memoryPointDetails?.sourcePhotoUrl,
          ),
          creator: item.user
            ? CreatorSummaryDto.create({
                id: item.user.id,
                firstName: item.user.firstName,
                lastName: item.user.lastName,
                email: item.user.email,
                avatar: item.user.avatar,
              })
            : null,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }),
      ),
    );

    return PageDto.create({ data, meta: pageMetaDto });
  }
}
