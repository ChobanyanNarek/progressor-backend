import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { LogLevel } from '../../../../constants/log-level.ts';
import { LogSource } from '../../../../constants/log-source.ts';
import { ADMIN_EDITABLE_STATUSES } from '../../../../constants/memory-point-status.ts';
import { GcsStorageService } from '../../../../shared/services/gcs-storage.service.ts';
import { AdminLogsService } from '../../../admin-logs/admin-logs.service.ts';
import { MemoryPointEntity } from '../../entities/memory-point.entity.ts';
import { MemoryPointDetailsEntity } from '../../entities/memory-point-details.entity.ts';
import { MemoryPointNotEditableException } from '../../exceptions/memory-point-not-editable.exception.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import {
  assertProvidedSourcesValid,
  normalizeOptionalPath,
} from '../../utils/media-upload.ts';
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
    private readonly gcsStorageService: GcsStorageService,
  ) {}

  /**
   * Admin edit of a point's texts and/or source media. Editing is only allowed
   * before (re)generation (`ADMIN_REVIEWING`/`REJECTED`); other statuses 403.
   *
   * UPSERT semantics are retained: a point can reach an editable status without
   * a details row (e.g. an admin moves a detail-less point to `ADMIN_REVIEWING`
   * via the status endpoint), so when the row is absent we INSERT a fresh one.
   * Every column is nullable, so a partial first write is valid. A bogus memory
   * point id 404s.
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

    if (!ADMIN_EDITABLE_STATUSES.includes(memoryPoint.status)) {
      throw new MemoryPointNotEditableException();
    }

    // Blank paths mean "not provided" — they must not overwrite stored values.
    const sourcePhotoUrl = normalizeOptionalPath(dto.sourcePhotoUrl);
    const sourceAudioUrl = normalizeOptionalPath(dto.sourceAudioUrl);

    /*
     * Validate any replacement media the same way the creator submit does:
     * each provided path must live under this point's prefix and the object must
     * exist in storage. Otherwise the admin could persist an arbitrary/dangling
     * path. Omitted paths are skipped.
     */
    await assertProvidedSourcesValid(this.gcsStorageService, memoryPointId, {
      sourcePhotoUrl,
      sourceAudioUrl,
    });

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

    if (sourcePhotoUrl !== undefined) {
      metadata.sourcePhotoUrl = sourcePhotoUrl;
    }

    if (sourceAudioUrl !== undefined) {
      metadata.sourceAudioUrl = sourceAudioUrl;
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
     * No details row yet — INSERT a fresh one (see method doc for when this
     * happens). All columns are nullable, so a partial write is valid.
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
