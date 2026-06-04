import { Command } from '@nestjs/cqrs';

import type { CreateMemoryPointDto } from '../../dtos/create-memory-point.dto.ts';
import type { MemoryPointDto } from '../../dtos/memory-point.dto.ts';

export class CreateMemoryPointCommand extends Command<MemoryPointDto> {
  constructor(
    public readonly userId: Uuid,
    public readonly createMemoryPointDto: CreateMemoryPointDto,
  ) {
    super();
  }
}
