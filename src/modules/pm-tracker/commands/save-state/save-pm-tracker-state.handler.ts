import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SavePmTrackerStateDto } from '../../dtos/save-pm-tracker-state.dto.ts';
import { PmTrackerTaskEntity } from '../../entities/pm-tracker-task.entity.ts';
import { PmTrackerStateEntity } from '../../pm-tracker-state.entity.ts';
import { syncTasksFromState } from '../sync-tasks/sync-tasks-from-state.ts';
import { SavePmTrackerStateCommand } from './save-pm-tracker-state.command.ts';

@Injectable()
@CommandHandler(SavePmTrackerStateCommand)
export class SavePmTrackerStateHandler
  implements ICommandHandler<SavePmTrackerStateCommand>
{
  private readonly logger = new Logger(SavePmTrackerStateHandler.name);

  constructor(
    @InjectRepository(PmTrackerStateEntity)
    private readonly repo: Repository<PmTrackerStateEntity>,
    @InjectRepository(PmTrackerTaskEntity)
    private readonly taskRepo: Repository<PmTrackerTaskEntity>,
  ) {}

  async execute(
    command: SavePmTrackerStateCommand,
  ): Promise<SavePmTrackerStateDto> {
    const existing = await this.repo
      .createQueryBuilder('s')
      .where('s.user_id = :userId', { userId: command.userId })
      .getOne();

    let result: SavePmTrackerStateDto;

    if (existing) {
      await this.repo
        .createQueryBuilder()
        .update(PmTrackerStateEntity)
        .set({ data: () => ':data' } as never)
        .setParameter('data', JSON.stringify(command.data))
        .where('id = :id', { id: existing.id })
        .execute();

      existing.data = command.data;

      result = existing.toDto() as unknown as SavePmTrackerStateDto;
    } else {
      const entity = this.repo.create({
        userId: command.userId,
        workspaceKey: null,
        data: command.data,
      });

      const saved = await this.repo.save(entity);

      result = saved.toDto() as unknown as SavePmTrackerStateDto;
    }

    /*
     * Dual-write into the pm_tracker_task mirror table used by
     * Search/Release-Notes pagination. Best-effort: a failure here must not
     * fail the blob save (the blob is still the frontend's source of truth),
     * so it's logged rather than thrown — the mirror self-heals on the next save.
     */
    try {
      await syncTasksFromState(this.taskRepo, command.userId, command.data);
    } catch (error) {
      this.logger.error(
        `Failed to sync pm_tracker_task for user ${command.userId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }

    return result;
  }
}
