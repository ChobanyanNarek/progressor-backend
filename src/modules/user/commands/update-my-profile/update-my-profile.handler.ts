import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { UserNotFoundException } from '../../../../exceptions/user-not-found.exception.ts';
import { UserEntity } from '../../user.entity.ts';
import { UpdateMyProfileCommand } from './update-my-profile.command.ts';

@CommandHandler(UpdateMyProfileCommand)
export class UpdateMyProfileHandler
  implements ICommandHandler<UpdateMyProfileCommand, void>
{
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(command: UpdateMyProfileCommand): Promise<void> {
    const { userId, dto } = command;

    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user) {
      throw new UserNotFoundException();
    }

    if (dto.phone !== undefined) {
      user.phone = dto.phone;
    }

    await this.userRepository.save(user);
  }
}
