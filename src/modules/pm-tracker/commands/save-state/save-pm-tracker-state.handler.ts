import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SavePmTrackerStateDto } from '../../dtos/save-pm-tracker-state.dto.ts';
import { PmTrackerStateEntity } from '../../pm-tracker-state.entity.ts';
import { SavePmTrackerStateCommand } from './save-pm-tracker-state.command.ts';

@Injectable()
@CommandHandler(SavePmTrackerStateCommand)
export class SavePmTrackerStateHandler
  implements ICommandHandler<SavePmTrackerStateCommand>
{
  constructor(
    @InjectRepository(PmTrackerStateEntity)
    private readonly repo: Repository<PmTrackerStateEntity>,
  ) {}

  async execute(
    command: SavePmTrackerStateCommand,
  ): Promise<SavePmTrackerStateDto> {
    const existing = await this.repo
      .createQueryBuilder('s')
      .where('s.user_id = :userId', { userId: command.userId })
      .getOne();

    if (existing) {
      await this.repo
        .createQueryBuilder()
        .update(PmTrackerStateEntity)
        .set({ data: () => ':data' } as never)
        .setParameter('data', JSON.stringify(command.data))
        .where('id = :id', { id: existing.id })
        .execute();

      existing.data = command.data;

      return existing.toDto() as unknown as SavePmTrackerStateDto;
    }

    const entity = this.repo.create({
      userId: command.userId,
      workspaceKey: null,
      data: command.data,
    });

    const saved = await this.repo.save(entity);

    return saved.toDto() as unknown as SavePmTrackerStateDto;
  }
}
