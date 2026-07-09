import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SavePmTrackerStateHandler } from './commands/save-state/save-pm-tracker-state.handler.ts';
import { PmTrackerController } from './pm-tracker.controller.ts';
import { PmTrackerService } from './pm-tracker.service.ts';
import { PmTrackerStateEntity } from './pm-tracker-state.entity.ts';
import { GetPmTrackerStateHandler } from './queries/get-state/get-pm-tracker-state.handler.ts';

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([PmTrackerStateEntity])],
  controllers: [PmTrackerController],
  providers: [
    PmTrackerService,
    SavePmTrackerStateHandler,
    GetPmTrackerStateHandler,
  ],
})
export class PmTrackerModule {}
