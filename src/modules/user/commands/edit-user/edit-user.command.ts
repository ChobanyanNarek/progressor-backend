import { Command } from '@nestjs/cqrs';

import type { EditUserDto } from '../../dtos/edit-user.dto.ts';
import type { UserDto } from '../../dtos/user.dto.ts';

export class EditUserCommand extends Command<UserDto> {
  constructor(
    public readonly userId: Uuid,
    public readonly editUserDto: EditUserDto,
  ) {
    super();
  }
}
