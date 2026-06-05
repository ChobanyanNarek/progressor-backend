import { Command } from '@nestjs/cqrs';

import type { AiGenerationStatus } from '../../../../constants/ai-generation-status.ts';

export interface ApplyGenerationResultPayload {
  status: AiGenerationStatus;
  videoUrl?: string;
  errorMessage?: string;
}

export class ApplyGenerationResultCommand extends Command<void> {
  constructor(
    public readonly memoryPointId: Uuid,
    public readonly payload: ApplyGenerationResultPayload,
  ) {
    super();
  }
}
