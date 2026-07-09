import { Command } from '@nestjs/cqrs';

export class AdminChangePasswordCommand extends Command<void> {
  constructor(
    public readonly userId: Uuid,
    public readonly password: string,
  ) {
    super();
  }
}
