import { Command } from '@nestjs/cqrs';

import type { MemoryPointAiGenerationDto } from '../../dtos/memory-point-ai-generation.dto.ts';

export class CreateAiGenerationCommand extends Command<MemoryPointAiGenerationDto> {
  constructor(public readonly memoryPointId: Uuid) {
    super();
  }
}
