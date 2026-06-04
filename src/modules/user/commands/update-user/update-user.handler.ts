import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { UserEntity } from '../../user.entity.ts';
import { UpdateUserCommand } from './update-user.command.ts';

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler
  implements ICommandHandler<UpdateUserCommand, void>
{
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(command: UpdateUserCommand): Promise<void> {
    const { userId, updateUserDto } = command;

    await this.userRepository
      .createQueryBuilder()
      .update()
      .set({ lastLogin: updateUserDto.lastLogin })
      .where('id = :id', { id: userId })
      .execute();
  }
}
