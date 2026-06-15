import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { LogLevel } from '../../../../constants/log-level.ts';
import { LogSource } from '../../../../constants/log-source.ts';
import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { AdminLogsService } from '../../../admin-logs/admin-logs.service.ts';
import { MemoryPointEntity } from '../../entities/memory-point.entity.ts';
import { InvalidStatusTransitionException } from '../../exceptions/invalid-status-transition.exception.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { UpdateMemoryPointStatusCommand } from './update-memory-point-status.command.ts';

/*
 * Allowed review-pipeline transitions. Every edge not listed here is illegal.
 * PENDING → ADMIN_REVIEWING (admin picks up the point for review)
 * ADMIN_REVIEWING → GENERATING (admin approves, triggers AI generation)
 * ADMIN_REVIEWING → REJECTED (admin rejects)
 * GENERATING → AI_REVIEWING (AI generation completes, AI review starts)
 * AI_REVIEWING → APPROVED (AI review passes)
 * AI_REVIEWING → REJECTED (AI review fails; re-submittable)
 * REJECTED → ADMIN_REVIEWING (creator re-submits after addressing feedback)
 */
const ALLOWED_STATUS_TRANSITIONS: Readonly<
  Record<MemoryPointStatus, ReadonlySet<MemoryPointStatus>>
> = {
  [MemoryPointStatus.PENDING]: new Set([MemoryPointStatus.ADMIN_REVIEWING]),
  [MemoryPointStatus.ADMIN_REVIEWING]: new Set([
    MemoryPointStatus.GENERATING,
    MemoryPointStatus.REJECTED,
  ]),
  [MemoryPointStatus.GENERATING]: new Set([MemoryPointStatus.AI_REVIEWING]),
  [MemoryPointStatus.AI_REVIEWING]: new Set([
    MemoryPointStatus.APPROVED,
    MemoryPointStatus.REJECTED,
  ]),
  [MemoryPointStatus.APPROVED]: new Set<MemoryPointStatus>(),
  [MemoryPointStatus.REJECTED]: new Set([MemoryPointStatus.ADMIN_REVIEWING]),
};

@CommandHandler(UpdateMemoryPointStatusCommand)
export class UpdateMemoryPointStatusHandler
  implements ICommandHandler<UpdateMemoryPointStatusCommand, void>
{
  constructor(
    @InjectRepository(MemoryPointEntity)
    private readonly memoryPointRepository: Repository<MemoryPointEntity>,
    private readonly adminLogsService: AdminLogsService,
  ) {}

  async execute(command: UpdateMemoryPointStatusCommand): Promise<void> {
    const { memoryPointId, status, actorId } = command;

    const point = await this.memoryPointRepository
      .createQueryBuilder('mp')
      .select(['mp.id', 'mp.status'])
      .where('mp.id = :id', { id: memoryPointId })
      .getOne();

    if (!point) {
      throw new MemoryPointNotFoundException();
    }

    if (!ALLOWED_STATUS_TRANSITIONS[point.status].has(status)) {
      throw new InvalidStatusTransitionException();
    }

    await this.memoryPointRepository
      .createQueryBuilder()
      .update()
      .set({ status })
      .where('id = :id', { id: memoryPointId })
      .execute();

    this.adminLogsService.record({
      level: LogLevel.INFO,
      source: LogSource.API,
      message: 'Memory point status updated',
      memoryPointId,
      context: { actorId, status },
    });
  }
}
