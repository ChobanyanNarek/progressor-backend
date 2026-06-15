import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { LogLevel } from '../../../../constants/log-level.ts';
import { LogSource } from '../../../../constants/log-source.ts';
import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { AdminLogsService } from '../../../admin-logs/admin-logs.service.ts';
import type { MemoryPointDto } from '../../dtos/memory-point.dto.ts';
import { MemoryPointEntity } from '../../entities/memory-point.entity.ts';
import { CreateMemoryPointCommand } from './create-memory-point.command.ts';

@CommandHandler(CreateMemoryPointCommand)
export class CreateMemoryPointHandler
  implements ICommandHandler<CreateMemoryPointCommand, MemoryPointDto>
{
  constructor(
    @InjectRepository(MemoryPointEntity)
    private readonly memoryPointRepository: Repository<MemoryPointEntity>,
    private readonly adminLogsService: AdminLogsService,
  ) {}

  async execute(command: CreateMemoryPointCommand): Promise<MemoryPointDto> {
    const { userId, createMemoryPointDto } = command;
    const { latitude, longitude } = createMemoryPointDto;

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

    this.adminLogsService.record({
      level: LogLevel.INFO,
      source: LogSource.API,
      message: 'Memory point created',
      memoryPointId: pointId,
      context: { actorId: userId },
    });

    return result.toDto();
  }
}
