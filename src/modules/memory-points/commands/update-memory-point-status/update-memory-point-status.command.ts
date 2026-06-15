import { Command } from '@nestjs/cqrs';

import type { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';

export class UpdateMemoryPointStatusCommand extends Command<void> {
  constructor(
    public readonly memoryPointId: Uuid,
    public readonly status: MemoryPointStatus,
    /** Admin who performed the change (audit trail). */
    public readonly actorId: Uuid,
  ) {
    super();
  }
}
