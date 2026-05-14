import { Command } from '@nestjs/cqrs';

import type { CreateUserDto } from '../dtos/create-user.dto.ts';
import type { UserDto } from '../dtos/user.dto.ts';

export class CreateUserCommand extends Command<UserDto> {
  constructor(public readonly createUserDto: CreateUserDto) {
    super();
  }
}
