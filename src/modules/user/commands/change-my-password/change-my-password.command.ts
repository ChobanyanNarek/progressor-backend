import { Command } from '@nestjs/cqrs';

import type { ChangeMyPasswordDto } from '../../dtos/change-my-password.dto.ts';

export class ChangeMyPasswordCommand extends Command<void> {
  constructor(
    public readonly userId: Uuid,
    public readonly dto: ChangeMyPasswordDto,
  ) {
    super();
  }
}
