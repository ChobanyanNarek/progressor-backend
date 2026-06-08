import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { UserNotFoundException } from '../../../../exceptions/user-not-found.exception.ts';
import type { UserDto } from '../../dtos/user.dto.ts';
import { UserEntity } from '../../user.entity.ts';
import { UpdateUserStatusCommand } from './update-user-status.command.ts';

@CommandHandler(UpdateUserStatusCommand)
export class UpdateUserStatusHandler
  implements ICommandHandler<UpdateUserStatusCommand, UserDto>
{
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(command: UpdateUserStatusCommand): Promise<UserDto> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :userId', { userId: command.userId })
      .getOne();

    if (!user) {
      throw new UserNotFoundException();
    }

    user.status = command.status;

    await this.userRepository.save(user);

    return user.toDto();
  }
}
