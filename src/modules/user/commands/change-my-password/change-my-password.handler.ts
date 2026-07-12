import { UnauthorizedException } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { generateHash, validateHash } from '../../../../common/utils.ts';
import { UserNotFoundException } from '../../../../exceptions/user-not-found.exception.ts';
import { UserEntity } from '../../user.entity.ts';
import { ChangeMyPasswordCommand } from './change-my-password.command.ts';

@CommandHandler(ChangeMyPasswordCommand)
export class ChangeMyPasswordHandler
  implements ICommandHandler<ChangeMyPasswordCommand, void>
{
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(command: ChangeMyPasswordCommand): Promise<void> {
    const { userId, dto } = command;

    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user) {
      throw new UserNotFoundException();
    }

    const isValid = await validateHash(dto.currentPassword, user.password);

    if (!isValid) {
      throw new UnauthorizedException('error.invalidCurrentPassword');
    }

    user.password = generateHash(dto.password);

    await this.userRepository.save(user);
  }
}
