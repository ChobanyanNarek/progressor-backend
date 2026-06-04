import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

import { ApiConfigService } from '../../../shared/services/api-config.service.ts';
import { DidWebhookDto } from '../dtos/did-webhook.dto.ts';
import { MemoryPointAiGenerationService } from '../services/memory-point-ai-generation.service.ts';

@Controller('webhooks/did')
export class DidWebhookController {
  private readonly webhookSecret: string;

  constructor(
    private readonly aiGenerationService: MemoryPointAiGenerationService,
    apiConfigService: ApiConfigService,
  ) {
    this.webhookSecret = apiConfigService.didConfig.webhookSecret;
  }

  @Post(':secret')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async handle(
    @Param('secret') secret: string,
    @Body() body: DidWebhookDto,
  ): Promise<{ received: boolean }> {
    if (secret !== this.webhookSecret) {
      throw new UnauthorizedException();
    }

    if (body.id) {
      await this.aiGenerationService.enqueueProcessing(body.id);
    }

    return { received: true };
  }
}
