import { Command } from '@nestjs/cqrs';

export class MarkGenerationStartedCommand extends Command<void> {
  constructor(public readonly memoryPointId: Uuid) {
    super();
  }
}
