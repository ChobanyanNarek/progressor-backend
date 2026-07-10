import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { UserNotFoundException } from '../../../../exceptions/user-not-found.exception.ts';
import { PmTrackerStateEntity } from '../../../pm-tracker/pm-tracker-state.entity.ts';
import { UserEntity } from '../../../user/user.entity.ts';
import { DeleteUserDataCommand } from './delete-user-data.command.ts';

@CommandHandler(DeleteUserDataCommand)
export class DeleteUserDataHandler
  implements ICommandHandler<DeleteUserDataCommand, void>
{
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(PmTrackerStateEntity)
    private readonly stateRepository: Repository<PmTrackerStateEntity>,
  ) {}

  async execute(command: DeleteUserDataCommand): Promise<void> {
    const hasUser = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id: command.userId })
      .getExists();

    if (!hasUser) {
      throw new UserNotFoundException();
    }

    await this.stateRepository
      .createQueryBuilder()
      .delete()
      .where('user_id = :userId', { userId: command.userId })
      .execute();
  }
}
