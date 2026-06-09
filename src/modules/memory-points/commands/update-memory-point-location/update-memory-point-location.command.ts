import { Command } from '@nestjs/cqrs';

export class UpdateMemoryPointLocationCommand extends Command<void> {
  constructor(
    public readonly memoryPointId: Uuid,
    public readonly latitude: number,
    public readonly longitude: number,
    /** When true, skip ownership and status guards (admin path). */
    public readonly shouldSkipOwnershipCheck: boolean,
    public readonly userId?: Uuid,
  ) {
    super();
  }
}
