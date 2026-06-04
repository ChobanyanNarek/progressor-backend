import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CloudTasksOidcGuard } from '../../guards/cloud-tasks-oidc.guard.ts';
import { CreateAiGenerationHandler } from './commands/create-ai-generation/create-ai-generation.handler.ts';
import { ProcessDidWebhookHandler } from './commands/process-did-webhook/process-did-webhook.handler.ts';
import { DidWebhookController } from './controllers/did-webhook.controller.ts';
import { InternalAiGenerationController } from './controllers/internal-ai-generation.controller.ts';
import { MemoryPointAiGenerationEntity } from './memory-point-ai-generation.entity.ts';
import { GetAiGenerationStatusHandler } from './queries/get-ai-generation-status/get-ai-generation-status.handler.ts';
import { DidService } from './services/did.service.ts';
import { MemoryPointAiGenerationService } from './services/memory-point-ai-generation.service.ts';

const commandHandlers = [CreateAiGenerationHandler, ProcessDidWebhookHandler];

const queryHandlers = [GetAiGenerationStatusHandler];

@Module({
  imports: [
    CqrsModule,
    HttpModule,
    TypeOrmModule.forFeature([MemoryPointAiGenerationEntity]),
  ],
  controllers: [DidWebhookController, InternalAiGenerationController],
  providers: [
    MemoryPointAiGenerationService,
    DidService,
    CloudTasksOidcGuard,
    ...commandHandlers,
    ...queryHandlers,
  ],
  exports: [MemoryPointAiGenerationService],
})
export class MemoryPointAiGenerationModule {}
