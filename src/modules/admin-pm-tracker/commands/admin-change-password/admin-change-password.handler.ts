import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { generateHash } from '../../../../common/utils.ts';
import { UserNotFoundException } from '../../../../exceptions/user-not-found.exception.ts';
import { UserEntity } from '../../../user/user.entity.ts';
import { AdminChangePasswordCommand } from './admin-change-password.command.ts';

@CommandHandler(AdminChangePasswordCommand)
export class AdminChangePasswordHandler
  implements ICommandHandler<AdminChangePasswordCommand, void>
{
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(command: AdminChangePasswordCommand): Promise<void> {
    const hasUser = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id: command.userId })
      .getExists();

    if (!hasUser) {
      throw new UserNotFoundException();
    }

    await this.userRepository
      .createQueryBuilder()
      .update()
      .set({ password: generateHash(command.password) })
      .where('id = :id', { id: command.userId })
      .execute();
  }
}
