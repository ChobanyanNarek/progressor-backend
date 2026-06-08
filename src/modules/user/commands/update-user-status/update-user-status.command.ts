import { Command } from '@nestjs/cqrs';

import type { AccountStatus } from '../../../../constants/account-status.ts';
import type { UserDto } from '../../dtos/user.dto.ts';

export class UpdateUserStatusCommand extends Command<UserDto> {
  constructor(
    public readonly userId: Uuid,
    public readonly status: AccountStatus,
  ) {
    super();
  }
}
