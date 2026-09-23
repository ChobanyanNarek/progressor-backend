import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminLogsModule } from '../admin-logs/admin-logs.module.ts';
import { DeleteCredentialHandler } from './commands/delete-credential/delete-credential.handler.ts';
import { ReportClientErrorHandler } from './commands/report-client-error/report-client-error.handler.ts';
import { SaveCredentialHandler } from './commands/save-credential/save-credential.handler.ts';
import { SavePmTrackerStateHandler } from './commands/save-state/save-pm-tracker-state.handler.ts';
import { PmTrackerCredentialEntity } from './entities/pm-tracker-credential.entity.ts';
import { PmTrackerTaskEntity } from './entities/pm-tracker-task.entity.ts';
import { PmTrackerController } from './pm-tracker.controller.ts';
import { PmTrackerService } from './pm-tracker.service.ts';
import { PmTrackerStateEntity } from './pm-tracker-state.entity.ts';
import { GetPmTrackerStateHandler } from './queries/get-state/get-pm-tracker-state.handler.ts';
import { ListCredentialsHandler } from './queries/list-credentials/list-credentials.handler.ts';
import { ReleaseNoteTasksHandler } from './queries/release-note-tasks/release-note-tasks.handler.ts';
import { ResolveCredentialHandler } from './queries/resolve-credential/resolve-credential.handler.ts';
import { SearchTasksHandler } from './queries/search-tasks/search-tasks.handler.ts';
import { CredentialCipherService } from './services/credential-cipher.service.ts';

@Module({
  imports: [
    AdminLogsModule,
    CqrsModule,
    TypeOrmModule.forFeature([
      PmTrackerStateEntity,
      PmTrackerTaskEntity,
      PmTrackerCredentialEntity,
    ]),
  ],
  controllers: [PmTrackerController],
  providers: [
    PmTrackerService,
    SavePmTrackerStateHandler,
    ReportClientErrorHandler,
    CredentialCipherService,
    SaveCredentialHandler,
    DeleteCredentialHandler,
    ListCredentialsHandler,
    ResolveCredentialHandler,
    GetPmTrackerStateHandler,
    SearchTasksHandler,
    ReleaseNoteTasksHandler,
  ],
})
export class PmTrackerModule {}
