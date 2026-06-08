import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MemoryPointAiGenerationModule } from '../memory-point-ai-generation/memory-point-ai-generation.module.ts';
import { ApplyGenerationResultHandler } from './commands/apply-generation-result/apply-generation-result.handler.ts';
import { CreateMemoryPointHandler } from './commands/create-memory-point/create-memory-point.handler.ts';
import { CreateUploadUrlHandler } from './commands/create-upload-url/create-upload-url.handler.ts';
import { DeleteMemoryPointHandler } from './commands/delete-memory-point/delete-memory-point.handler.ts';
import { MarkGenerationStartedHandler } from './commands/mark-generation-started/mark-generation-started.handler.ts';
import { UpdateMemoryPointDetailsHandler } from './commands/update-memory-point-details/update-memory-point-details.handler.ts';
import { UpdateMemoryPointStatusHandler } from './commands/update-memory-point-status/update-memory-point-status.handler.ts';
import { UpsertMemoryPointDetailsHandler } from './commands/upsert-memory-point-details/upsert-memory-point-details.handler.ts';
import { AdminMemoryPointController } from './controllers/admin-memory-point.controller.ts';
import { CreatorMemoryPointController } from './controllers/creator-memory-point.controller.ts';
import { MemoryPointController } from './controllers/memory-point.controller.ts';
import { MemoryPointEntity } from './entities/memory-point.entity.ts';
import { MemoryPointDetailsEntity } from './entities/memory-point-details.entity.ts';
import { MemoryPointService } from './memory-point.service.ts';
import { GetAllMemoryPointsHandler } from './queries/get-all-memory-points/get-all-memory-points.handler.ts';
import { GetMemoryPointHandler } from './queries/get-memory-point/get-memory-point.handler.ts';
import { GetMemoryPointGenerationSourceHandler } from './queries/get-memory-point-generation-source/get-memory-point-generation-source.handler.ts';
import { GetMyMemoryPointsHandler } from './queries/get-my-memory-points/get-my-memory-points.handler.ts';
import { GetNearbyMemoryPointsHandler } from './queries/get-nearby-memory-points/get-nearby-memory-points.handler.ts';

const commandHandlers = [
  CreateMemoryPointHandler,
  UpdateMemoryPointStatusHandler,
  UpdateMemoryPointDetailsHandler,
  UpsertMemoryPointDetailsHandler,
  DeleteMemoryPointHandler,
  MarkGenerationStartedHandler,
  ApplyGenerationResultHandler,
  CreateUploadUrlHandler,
];

const queryHandlers = [
  GetMemoryPointHandler,
  GetMemoryPointGenerationSourceHandler,
  GetMyMemoryPointsHandler,
  GetAllMemoryPointsHandler,
  GetNearbyMemoryPointsHandler,
];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([MemoryPointEntity, MemoryPointDetailsEntity]),
    MemoryPointAiGenerationModule,
  ],
  controllers: [
    MemoryPointController,
    CreatorMemoryPointController,
    AdminMemoryPointController,
  ],
  providers: [MemoryPointService, ...commandHandlers, ...queryHandlers],
  exports: [MemoryPointService],
})
export class MemoryPointModule {}
