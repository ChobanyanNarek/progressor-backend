import { Command } from '@nestjs/cqrs';

import type { UpdateUserDto } from '../../dtos/update-user.dto.ts';

export class UpdateUserCommand extends Command<void> {
  constructor(
    public readonly userId: Uuid,
    public readonly updateUserDto: UpdateUserDto,
  ) {
    super();
  }
}
