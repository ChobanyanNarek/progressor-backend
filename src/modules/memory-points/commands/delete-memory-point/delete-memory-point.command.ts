import { Command } from '@nestjs/cqrs';

export class DeleteMemoryPointCommand extends Command<void> {
  constructor(public readonly memoryPointId: Uuid) {
    super();
  }
}
