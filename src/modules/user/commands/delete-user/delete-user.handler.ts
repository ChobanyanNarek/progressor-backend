import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { UserNotFoundException } from '../../../../exceptions/user-not-found.exception.ts';
import { UserEntity } from '../../user.entity.ts';
import { DeleteUserCommand } from './delete-user.command.ts';

@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler
  implements ICommandHandler<DeleteUserCommand, void>
{
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(command: DeleteUserCommand): Promise<void> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :userId', { userId: command.userId })
      .getOne();

    if (!user) {
      throw new UserNotFoundException();
    }

    await this.userRepository.remove(user);
  }
}
