import { Command } from '@nestjs/cqrs';

import type { RoleType } from '../../../../constants/role-type.ts';
import type { UserDto } from '../../dtos/user.dto.ts';

export class UpdateUserRoleCommand extends Command<UserDto> {
  constructor(
    public readonly userId: Uuid,
    public readonly role: RoleType,
  ) {
    super();
  }
}
