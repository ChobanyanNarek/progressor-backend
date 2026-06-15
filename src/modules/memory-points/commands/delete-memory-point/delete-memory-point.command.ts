import { Command } from '@nestjs/cqrs';

export class DeleteMemoryPointCommand extends Command<void> {
  constructor(
    public readonly memoryPointId: Uuid,
    /** Admin who performed the deletion (audit trail). */
    public readonly actorId: Uuid,
  ) {
    super();
  }
}
