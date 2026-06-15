import { Command } from '@nestjs/cqrs';

import type { UpdateMemoryPointDetailsDto } from '../../dtos/update-memory-point-details.dto.ts';

export class UpdateMemoryPointDetailsCommand extends Command<void> {
  constructor(
    public readonly memoryPointId: Uuid,
    public readonly dto: UpdateMemoryPointDetailsDto,
    /** Admin who performed the edit (audit trail). */
    public readonly actorId: Uuid,
  ) {
    super();
  }
}
