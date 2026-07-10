import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { UserNotFoundException } from '../../../../exceptions/user-not-found.exception.ts';
import type { UserDto } from '../../dtos/user.dto.ts';
import { UserExistsException } from '../../exceptions/user-exists.exception.ts';
import { UserEntity } from '../../user.entity.ts';
import { EditUserCommand } from './edit-user.command.ts';

@CommandHandler(EditUserCommand)
export class EditUserHandler
  implements ICommandHandler<EditUserCommand, UserDto>
{
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(command: EditUserCommand): Promise<UserDto> {
    const { userId, editUserDto } = command;

    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user) {
      throw new UserNotFoundException();
    }

    if (editUserDto.email !== undefined && editUserDto.email !== user.email) {
      const existing = await this.userRepository
        .createQueryBuilder('user')
        .where('user.email = :email', { email: editUserDto.email })
        .getOne();

      if (existing) {
        throw new UserExistsException();
      }

      user.email = editUserDto.email;
    }

    if (editUserDto.firstName !== undefined) {
      user.firstName = editUserDto.firstName;
    }

    if (editUserDto.lastName !== undefined) {
      user.lastName = editUserDto.lastName;
    }

    if (editUserDto.role !== undefined) {
      user.role = editUserDto.role;
    }

    if (editUserDto.avatar !== undefined) {
      user.avatar = editUserDto.avatar;
    }

    if (editUserDto.phone !== undefined) {
      user.phone = editUserDto.phone;
    }

    await this.userRepository.save(user);

    return user.toDto();
  }
}
