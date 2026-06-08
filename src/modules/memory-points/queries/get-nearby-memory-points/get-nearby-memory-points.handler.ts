import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { PageDto } from '../../../../common/dto/page.dto.ts';
import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { NearbyMemoryPointDto } from '../../dtos/nearby-memory-point.dto.ts';
import { MemoryPointEntity } from '../../entities/memory-point.entity.ts';
import { GetNearbyMemoryPointsQuery } from './get-nearby-memory-points.query.ts';

@QueryHandler(GetNearbyMemoryPointsQuery)
export class GetNearbyMemoryPointsHandler
  implements
    IQueryHandler<GetNearbyMemoryPointsQuery, PageDto<NearbyMemoryPointDto>>
{
  constructor(
    @InjectRepository(MemoryPointEntity)
    private readonly memoryPointRepository: Repository<MemoryPointEntity>,
  ) {}

  async execute(
    query: GetNearbyMemoryPointsQuery,
  ): Promise<PageDto<NearbyMemoryPointDto>> {
    const { latitude, longitude, radiusMeters, name } = query.pageOptionsDto;

    const userPoint =
      'ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography';

    const queryBuilder = this.memoryPointRepository
      .createQueryBuilder('mp')
      .leftJoinAndSelect('mp.memoryPointDetails', 'details')
      .addSelect(
        `ST_Distance(mp.location::geography, ${userPoint})`,
        'distance',
      )
      .where('mp.status = :status', { status: MemoryPointStatus.APPROVED })
      .andWhere(`ST_DWithin(mp.location::geography, ${userPoint}, :radius)`)
      .orderBy('distance', 'ASC')
      .setParameters({
        longitude,
        latitude,
        radius: radiusMeters,
      });

    if (name) {
      queryBuilder.andWhere('details.title ILIKE :name', {
        name: `%${name}%`,
      });
    }

    const [items, pageMetaDto] = await queryBuilder.paginate(
      query.pageOptionsDto,
    );

    return PageDto.create({
      data: items.map((item) =>
        NearbyMemoryPointDto.create({
          id: item.id,
          location: item.location,
        }),
      ),
      meta: pageMetaDto,
    });
  }
}
