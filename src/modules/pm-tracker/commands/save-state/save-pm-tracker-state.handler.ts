import { ConflictException, Injectable, Logger } from '@nestjs/common';
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
    /*
     * Select the row's identity only. getOne() on the full entity pulled the entire
     * existing blob (several MB of JSONB) out of Postgres and parsed it, purely to learn
     * its id -- one more full copy of the state held in memory on every save.
     */
    const existing = await this.repo
      .createQueryBuilder('s')
      .select(['s.id', 's.createdAt', 's.updatedAt', 's.migratedAt'])
      .where('s.user_id = :userId', { userId: command.userId })
      .getOne();

    /*
     * Once a user's data has moved to per-record storage (ADR-0018) the blob is a frozen
     * backup. A whole-blob write from an old open tab would be silently ignored at best,
     * so refuse it; that tab picks up the new version when reloaded.
     */
    if (existing?.migratedAt) {
      throw new ConflictException('error.pmTrackerStateMigrated');
    }

    let saved: PmTrackerStateEntity;

    if (existing) {
      const result = await this.repo
        .createQueryBuilder()
        .update(PmTrackerStateEntity)
        .set({ data: () => ':data' } as never)
        .setParameter('data', JSON.stringify(command.data))
        // Re-checked under the row lock: a migration that finished meanwhile wins.
        .where('id = :id AND migrated_at IS NULL', { id: existing.id })
        .execute();

      if (result.affected === 0) {
        throw new ConflictException('error.pmTrackerStateMigrated');
      }

      saved = existing;
    } else {
      saved = await this.repo.save(
        this.repo.create({
          userId: command.userId,
          workspaceKey: null,
          data: command.data,
        }),
      );
    }

    /*
     * Reply without the blob. The response used to echo the whole saved state back,
     * so the client had to download several MB again before its save counted as done,
     * inside its request timeout, and the server serialised a further full copy. The
     * client reads only the status code; the state itself is fetched with GET /state.
     */
    saved.data = {};

    const result = saved.toDto() as unknown as SavePmTrackerStateDto;

    /*
     * Refresh the pm_tracker_task mirror AFTER replying. It rewrites every task row, and
     * awaiting it made each save wait on a full table sync before the client heard back.
     * Best-effort as before: the blob is the source of truth and the mirror self-heals on
     * the next save.
     */
    void syncTasksFromState(this.taskRepo, command.userId, command.data).catch(
      (error: unknown) => {
        this.logger.error(
          `Failed to sync pm_tracker_task for user ${command.userId}`,
          error instanceof Error ? error.stack : String(error),
        );
      },
    );

    return result;
  }
}
