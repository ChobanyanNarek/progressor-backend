import { Command } from '@nestjs/cqrs';

import type { MemoryPointDetailsDto } from '../../dtos/memory-point-details.dto.ts';
import type { UpsertMemoryPointDetailsDto } from '../../dtos/upsert-memory-point-details.dto.ts';

export class UpsertMemoryPointDetailsCommand extends Command<MemoryPointDetailsDto> {
  constructor(
    public readonly memoryPointId: Uuid,
    public readonly userId: Uuid,
    public readonly upsertMemoryPointDetailsDto: UpsertMemoryPointDetailsDto,
  ) {
    super();
  }
}
