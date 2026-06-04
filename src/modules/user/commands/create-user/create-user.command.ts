import { Command } from '@nestjs/cqrs';

import type { CreateUserDto } from '../../dtos/create-user.dto.ts';

export class CreateUserCommand extends Command<{ id: Uuid }> {
  constructor(public readonly createUserDto: CreateUserDto) {
    super();
  }
}
