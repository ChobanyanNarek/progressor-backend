import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import type { UserDto } from '../../dtos/user.dto.ts';
import { UserExistsException } from '../../exceptions/user-exists.exception.ts';
import { UserEntity } from '../../user.entity.ts';
import { CreateUserCommand } from './create-user.command.ts';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler
  implements ICommandHandler<CreateUserCommand, UserDto>
{
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(command: CreateUserCommand): Promise<Uuid> {
    const { firstName, lastName, email, role, password, status } =
      command.createUserDto;

    const existingUser = await this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .getOne();

    if (existingUser) {
      throw new UserExistsException();
    }

    const user = this.userRepository.create({
      firstName,
      lastName,
      email,
      password,
      role,
      status,
    });

    await this.userRepository.save(user);

    return user.id;
  }
}
