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
     * Duplicate proximity check: reject if any existing point lies within the
     * configured radius, unless the caller explicitly opts out with force: true.
     * getRawOne lets us read both the id and the computed distance column in a
     * single round-trip without TypeORM trying to hydrate a partial entity.
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
