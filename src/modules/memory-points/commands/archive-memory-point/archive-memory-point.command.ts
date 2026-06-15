import { Command } from '@nestjs/cqrs';

export class ArchiveMemoryPointCommand extends Command<void> {
  constructor(public readonly memoryPointId: Uuid) {
    super();
  }
}
