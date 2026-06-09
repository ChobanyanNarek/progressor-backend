import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { ApiConfigService } from '../../../../shared/services/api-config.service.ts';
import type { MemoryPointDto } from '../../dtos/memory-point.dto.ts';
import { MemoryPointEntity } from '../../entities/memory-point.entity.ts';
import { DuplicateMemoryPointException } from '../../exceptions/duplicate-memory-point.exception.ts';
import { CreateMemoryPointCommand } from './create-memory-point.command.ts';

@CommandHandler(CreateMemoryPointCommand)
export class CreateMemoryPointHandler
  implements ICommandHandler<CreateMemoryPointCommand, MemoryPointDto>
{
  constructor(
    @InjectRepository(MemoryPointEntity)
    private readonly memoryPointRepository: Repository<MemoryPointEntity>,
    private readonly apiConfigService: ApiConfigService,
  ) {}

  async execute(command: CreateMemoryPointCommand): Promise<MemoryPointDto> {
    const { userId, createMemoryPointDto } = command;
    const {
      latitude,
      longitude,
      force: shouldForceCreate,
    } = createMemoryPointDto;

    /*
     * Duplicate proximity check: reject if a *live* existing point lies within
     * the configured radius, unless the caller opts out with force: true.
     * getRawOne reads the id + computed distance in one round-trip without
     * TypeORM hydrating a partial entity.
     *
     * REJECTED points are excluded — a dead point must not block a legitimate
     * re-creation at the same spot. Abandoned PENDING drafts are handled
     * separately by CleanupStaleDraftsHandler, so they age out rather than
     * permanently blocking the location.
     *
     * NOTE: this is a check-then-insert with a race window — two concurrent
     * creates at the same coordinates can both pass the check and insert. The
     * durable fix is a PostGIS exclusion constraint (EXCLUDE USING gist on a
     * buffered geography), which needs a generated migration; tracked as a
     * follow-up. For the test version the read-side check is acceptable.
     */
    if (!shouldForceCreate) {
      const radiusMeters = this.apiConfigService.duplicateRadiusMeters;
      const userPoint =
        'ST_SetSRID(ST_MakePoint(:dupLng, :dupLat), 4326)::geography';

      const near = await this.memoryPointRepository
        .createQueryBuilder('mp')
        .select('mp.id', 'id')
        .addSelect(
          `ST_Distance(mp.location::geography, ${userPoint})`,
          'distance',
        )
        .where(`ST_DWithin(mp.location::geography, ${userPoint}, :dupRadius)`)
        .andWhere('mp.status != :excludedStatus', {
          excludedStatus: MemoryPointStatus.REJECTED,
        })
        .setParameters({
          dupLng: longitude,
          dupLat: latitude,
          dupRadius: radiusMeters,
        })
        .orderBy('distance', 'ASC')
        .getRawOne<{ id: Uuid; distance: string }>();

      if (near) {
        throw new DuplicateMemoryPointException(near.id, Number(near.distance));
      }
    }

    const insertResult = await this.memoryPointRepository
      .createQueryBuilder()
      .insert()
      .into(MemoryPointEntity)
      .values({
        userId,
        status: MemoryPointStatus.PENDING,
        location: () => `ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)`,
      })
      .setParameters({ longitude, latitude })
      .execute();

    const pointId = insertResult.identifiers[0]!.id as Uuid;

    const result = await this.memoryPointRepository
      .createQueryBuilder('memoryPoint')
      .where('memoryPoint.id = :id', { id: pointId })
      .getOneOrFail();

    return result.toDto();
  }
}
