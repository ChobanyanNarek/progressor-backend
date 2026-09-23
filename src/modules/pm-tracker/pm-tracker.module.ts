import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminLogsModule } from '../admin-logs/admin-logs.module.ts';
import { ReportClientErrorHandler } from './commands/report-client-error/report-client-error.handler.ts';
import { SavePmTrackerStateHandler } from './commands/save-state/save-pm-tracker-state.handler.ts';
import { PmTrackerTaskEntity } from './entities/pm-tracker-task.entity.ts';
import { PmTrackerController } from './pm-tracker.controller.ts';
import { PmTrackerService } from './pm-tracker.service.ts';
import { PmTrackerStateEntity } from './pm-tracker-state.entity.ts';
import { GetPmTrackerStateHandler } from './queries/get-state/get-pm-tracker-state.handler.ts';
import { ReleaseNoteTasksHandler } from './queries/release-note-tasks/release-note-tasks.handler.ts';
import { SearchTasksHandler } from './queries/search-tasks/search-tasks.handler.ts';

@Module({
  imports: [
    AdminLogsModule,
    CqrsModule,
    TypeOrmModule.forFeature([PmTrackerStateEntity, PmTrackerTaskEntity]),
  ],
  controllers: [PmTrackerController],
  providers: [
    PmTrackerService,
    SavePmTrackerStateHandler,
    ReportClientErrorHandler,
    GetPmTrackerStateHandler,
    SearchTasksHandler,
    ReleaseNoteTasksHandler,
  ],
})
export class PmTrackerModule {}
