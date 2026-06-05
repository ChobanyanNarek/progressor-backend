import { Command } from '@nestjs/cqrs';

import type { CreateUserDto } from '../../dtos/create-user.dto.ts';
import type { CreateUserResultDto } from '../../dtos/create-user-result.dto.ts';

export class CreateUserCommand extends Command<CreateUserResultDto> {
  constructor(public readonly createUserDto: CreateUserDto) {
    super();
  }
}
