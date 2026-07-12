import { Command } from '@nestjs/cqrs';

import type { UpdateMyProfileDto } from '../../dtos/update-my-profile.dto.ts';

export class UpdateMyProfileCommand extends Command<void> {
  constructor(
    public readonly userId: Uuid,
    public readonly dto: UpdateMyProfileDto,
  ) {
    super();
  }
}
