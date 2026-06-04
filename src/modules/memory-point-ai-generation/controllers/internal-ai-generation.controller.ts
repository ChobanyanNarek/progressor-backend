import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

import { CloudTasksOidcGuard } from '../../../guards/cloud-tasks-oidc.guard.ts';
import { ProcessGenerationTaskDto } from '../dtos/process-generation-task.dto.ts';
import { MemoryPointAiGenerationService } from '../services/memory-point-ai-generation.service.ts';

@Controller('internal/ai-generation')
@UseGuards(CloudTasksOidcGuard)
export class InternalAiGenerationController {
  constructor(
    private readonly aiGenerationService: MemoryPointAiGenerationService,
  ) {}

  @Post('process')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async process(
    @Body() body: ProcessGenerationTaskDto,
  ): Promise<{ processed: boolean }> {
    await this.aiGenerationService.processWebhook(body.talkId);

    return { processed: true };
  }
}
