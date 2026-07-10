import { Command } from '@nestjs/cqrs';

export class DeleteUserDataCommand extends Command<void> {
  constructor(public readonly userId: Uuid) {
    super();
  }
}
