import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { ApiConfigService } from '../../../../shared/services/api-config.service.ts';
import { MemoryPointEntity } from '../../entities/memory-point.entity.ts';
import { DuplicateMemoryPointException } from '../../exceptions/duplicate-memory-point.exception.ts';
import { MemoryPointNotEditableException } from '../../exceptions/memory-point-not-editable.exception.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { UpdateMemoryPointLocationCommand } from './update-memory-point-location.command.ts';

const LOCATION_EXPR = `ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)`;

@CommandHandler(UpdateMemoryPointLocationCommand)
export class UpdateMemoryPointLocationHandler
  implements ICommandHandler<UpdateMemoryPointLocationCommand, void>
{
  constructor(
    @InjectRepository(MemoryPointEntity)
    private readonly memoryPointRepository: Repository<MemoryPointEntity>,
    private readonly apiConfigService: ApiConfigService,
  ) {}

  async execute(command: UpdateMemoryPointLocationCommand): Promise<void> {
    const { memoryPointId, latitude, longitude, actor } = command;

    /*
     * Repositioning is still subject to proximity dedup — but the point being
     * moved must never collide with *itself* (its own current location), so it
     * is excluded from the candidates. A conflict with any *other* live point
     * still blocks the move.
     */
    await this.assertNoNearbyDuplicate(memoryPointId, latitude, longitude);

    if (actor.kind === 'admin') {
      // Admin may reposition any point in any status.
      const result = await this.memoryPointRepository
        .createQueryBuilder()
        .update()
        .set({ location: () => LOCATION_EXPR })
        .where('id = :id', { id: memoryPointId })
        .setParameters({ longitude, latitude })
        .execute();

      if (result.affected === 0) {
        throw new MemoryPointNotFoundException();
      }

      return;
    }

    /*
     * Creator path. Re-assert ownership AND PENDING state inside the UPDATE
     * WHERE so the guard is atomic — a separate SELECT-then-UPDATE would have a
     * TOCTOU window (status could flip between the read and the write). On a
     * zero-row update we run one classification read to preserve the distinct
     * NotFound (no such owned point) vs NotEditable (owned but past PENDING)
     * codes the client relies on.
     */
    const result = await this.memoryPointRepository
      .createQueryBuilder()
      .update()
      .set({ location: () => LOCATION_EXPR })
      .where('id = :id', { id: memoryPointId })
      .andWhere('user_id = :userId', { userId: actor.userId })
      .andWhere('status = :status', { status: MemoryPointStatus.PENDING })
      .setParameters({ longitude, latitude })
      .execute();

    if (result.affected === 0) {
      await this.throwCreatorFailure(memoryPointId, actor.userId);
    }
  }

  /**
   * Reject the move if a *live* existing point — other than the one being
   * moved — lies within the configured radius of the new coordinates. Mirrors
   * the create-time check, with `mp.id != :selfId` so a point never blocks its
   * own repositioning (e.g. nudging it a few metres). REJECTED points are dead
   * and excluded, same as on create.
   */
  private async assertNoNearbyDuplicate(
    memoryPointId: Uuid,
    latitude: number,
    longitude: number,
  ): Promise<void> {
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
      .andWhere('mp.id != :selfId', { selfId: memoryPointId })
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

  /** Classify why the guarded update matched no row. Always throws. */
  private async throwCreatorFailure(
    memoryPointId: Uuid,
    userId: Uuid,
  ): Promise<never> {
    const owned = await this.memoryPointRepository
      .createQueryBuilder('mp')
      .select(['mp.id', 'mp.status'])
      .where('mp.id = :id', { id: memoryPointId })
      .andWhere('mp.userId = :userId', { userId })
      .getOne();

    if (!owned) {
      throw new MemoryPointNotFoundException();
    }

    // Owned but not PENDING.
    throw new MemoryPointNotEditableException();
  }
}
