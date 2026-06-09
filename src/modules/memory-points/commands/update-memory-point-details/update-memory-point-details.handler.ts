import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { LogLevel } from '../../../../constants/log-level.ts';
import { LogSource } from '../../../../constants/log-source.ts';
import { AdminLogsService } from '../../../admin-logs/admin-logs.service.ts';
import { MemoryPointEntity } from '../../entities/memory-point.entity.ts';
import { MemoryPointDetailsEntity } from '../../entities/memory-point-details.entity.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { UpdateMemoryPointDetailsCommand } from './update-memory-point-details.command.ts';

@CommandHandler(UpdateMemoryPointDetailsCommand)
export class UpdateMemoryPointDetailsHandler
  implements ICommandHandler<UpdateMemoryPointDetailsCommand, void>
{
  constructor(
    @InjectRepository(MemoryPointEntity)
    private readonly memoryPointRepository: Repository<MemoryPointEntity>,
    @InjectRepository(MemoryPointDetailsEntity)
    private readonly detailsRepository: Repository<MemoryPointDetailsEntity>,
    private readonly adminLogsService: AdminLogsService,
  ) {}

  /**
   * Admin metadata edit. A freshly-created PENDING point has no details row yet,
   * so this is an UPSERT rather than a plain update: when the row is absent we
   * INSERT a metadata-only details row (sources stay NULL until the creator
   * uploads media). A bogus memory point id still 404s.
   */
  async execute(command: UpdateMemoryPointDetailsCommand): Promise<void> {
    const { memoryPointId, dto, actorId } = command;

    const memoryPoint = await this.memoryPointRepository
      .createQueryBuilder('mp')
      .where('mp.id = :id', { id: memoryPointId })
      .getOne();

    if (!memoryPoint) {
      throw new MemoryPointNotFoundException();
    }

    const metadata: Partial<MemoryPointDetailsEntity> = {};

    if (dto.title !== undefined) {
      metadata.title = dto.title;
    }

    if (dto.description !== undefined) {
      metadata.description = dto.description;
    }

    if (dto.cloudAnchorId !== undefined) {
      metadata.cloudAnchorId = dto.cloudAnchorId;
    }

    if (dto.type !== undefined) {
      metadata.type = dto.type;
    }

    const existingDetails = await this.detailsRepository
      .createQueryBuilder('details')
      .where('details.memoryPointId = :memoryPointId', { memoryPointId })
      .getOne();

    if (existingDetails) {
      // Nothing to change — avoid TypeORM's "update values are not defined".
      if (Object.keys(metadata).length === 0) {
        return;
      }

      await this.detailsRepository
        .createQueryBuilder()
        .update()
        .set(metadata)
        .where('memory_point_id = :memoryPointId', { memoryPointId })
        .execute();

      this.recordDetailsUpdated(memoryPointId, actorId);

      return;
    }

    /*
     * No details row yet (fresh PENDING point). Insert a metadata-only row with
     * NULL sources; the creator's upload flow fills the sources later. `type` is
     * a NOT NULL enum, so the admin must supply it when creating the first
     * details row — the DB enforces this if omitted.
     */
    await this.detailsRepository
      .createQueryBuilder()
      .insert()
      .values({ ...metadata, memoryPointId })
      .execute();

    this.recordDetailsUpdated(memoryPointId, actorId);
  }

  private recordDetailsUpdated(memoryPointId: Uuid, actorId: Uuid): void {
    this.adminLogsService.record({
      level: LogLevel.INFO,
      source: LogSource.API,
      message: 'Memory point details updated',
      memoryPointId,
      context: { actorId },
    });
  }
}
