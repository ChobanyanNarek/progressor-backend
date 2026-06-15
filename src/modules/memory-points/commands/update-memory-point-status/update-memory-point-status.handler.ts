import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { LogLevel } from '../../../../constants/log-level.ts';
import { LogSource } from '../../../../constants/log-source.ts';
import { AdminLogsService } from '../../../admin-logs/admin-logs.service.ts';
import { MemoryPointEntity } from '../../entities/memory-point.entity.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { UpdateMemoryPointStatusCommand } from './update-memory-point-status.command.ts';

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

    const result = await this.memoryPointRepository
      .createQueryBuilder()
      .update()
      .set({ status })
      .where('id = :id', { id: memoryPointId })
      .execute();

    if (result.affected === 0) {
      throw new MemoryPointNotFoundException();
    }

    this.adminLogsService.record({
      level: LogLevel.INFO,
      source: LogSource.API,
      message: 'Memory point status updated',
      memoryPointId,
      context: { actorId, status },
    });
  }
}
