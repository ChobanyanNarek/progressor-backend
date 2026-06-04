import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import type { RoleType } from '../../../constants/role-type.ts';
import { CloudTasksService } from '../../../shared/services/cloud-tasks.service.ts';
import { CreateAiGenerationCommand } from '../commands/create-ai-generation/create-ai-generation.command.ts';
import { ProcessDidWebhookCommand } from '../commands/process-did-webhook/process-did-webhook.command.ts';
import type { AiGenerationStatusResponseDto } from '../dtos/ai-generation-status.dto.ts';
import type { MemoryPointAiGenerationDto } from '../dtos/memory-point-ai-generation.dto.ts';
import { GetAiGenerationStatusQuery } from '../queries/get-ai-generation-status/get-ai-generation-status.query.ts';

@Injectable()
export class MemoryPointAiGenerationService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly cloudTasksService: CloudTasksService,
  ) {}

  generate(memoryPointId: Uuid): Promise<MemoryPointAiGenerationDto> {
    return this.commandBus.execute<
      CreateAiGenerationCommand,
      MemoryPointAiGenerationDto
    >(new CreateAiGenerationCommand(memoryPointId));
  }

  /**
   * Hand the talk off to Cloud Tasks for background processing and return
   * immediately, so the D-ID webhook can be acknowledged without waiting for the
   * video download/upload.
   */
  enqueueProcessing(talkId: string): Promise<void> {
    return this.cloudTasksService.enqueue({ talkId });
  }

  processWebhook(talkId: string): Promise<void> {
    return this.commandBus.execute<ProcessDidWebhookCommand>(
      new ProcessDidWebhookCommand(talkId),
    );
  }

  getStatus(
    memoryPointId: Uuid,
    userId?: Uuid,
    role?: RoleType,
  ): Promise<AiGenerationStatusResponseDto> {
    return this.queryBus.execute<
      GetAiGenerationStatusQuery,
      AiGenerationStatusResponseDto
    >(new GetAiGenerationStatusQuery(memoryPointId, userId, role));
  }
}
