import { Command } from '@nestjs/cqrs';

export class DeactivateMemoryPointCommand extends Command<void> {
  constructor(
    public readonly memoryPointId: Uuid,
    public readonly userId: Uuid,
  ) {
    super();
  }
}
