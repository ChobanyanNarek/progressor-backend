import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminLogsModule } from '../admin-logs/admin-logs.module.ts';
import { CommitRecordsHandler } from './commands/commit-records/commit-records.handler.ts';
import { DeleteCredentialHandler } from './commands/delete-credential/delete-credential.handler.ts';
import { MigrateStateToRecordsHandler } from './commands/migrate-state/migrate-state-to-records.handler.ts';
import { ReportClientErrorHandler } from './commands/report-client-error/report-client-error.handler.ts';
import { SaveCredentialHandler } from './commands/save-credential/save-credential.handler.ts';
import { SavePmTrackerStateHandler } from './commands/save-state/save-pm-tracker-state.handler.ts';
import { PmTrackerCredentialEntity } from './entities/pm-tracker-credential.entity.ts';
import { PmTrackerDocEntity } from './entities/pm-tracker-doc.entity.ts';
import { PmTrackerHookEntity } from './entities/pm-tracker-hook.entity.ts';
import { PmTrackerTaskEntity } from './entities/pm-tracker-task.entity.ts';
import { PmTrackerTombstoneEntity } from './entities/pm-tracker-tombstone.entity.ts';
import { PmTrackerController } from './pm-tracker.controller.ts';
import { PmTrackerService } from './pm-tracker.service.ts';
import { PmTrackerStateEntity } from './pm-tracker-state.entity.ts';
import { GetRecordsHandler } from './queries/get-records/get-records.handler.ts';
import { GetRecordsJsonHandler } from './queries/get-records-json/get-records-json.handler.ts';
import { GetPmTrackerStateHandler } from './queries/get-state/get-pm-tracker-state.handler.ts';
import { ListCredentialsHandler } from './queries/list-credentials/list-credentials.handler.ts';
import { ReleaseNoteTasksHandler } from './queries/release-note-tasks/release-note-tasks.handler.ts';
import { ResolveCredentialHandler } from './queries/resolve-credential/resolve-credential.handler.ts';
import { SearchTasksHandler } from './queries/search-tasks/search-tasks.handler.ts';
import { CredentialCipherService } from './services/credential-cipher.service.ts';
import { ServerSyncService } from './services/server-sync.service.ts';

@Module({
  imports: [
    AdminLogsModule,
    CqrsModule,
    TypeOrmModule.forFeature([
      PmTrackerStateEntity,
      PmTrackerTaskEntity,
      PmTrackerCredentialEntity,
      PmTrackerDocEntity,
      PmTrackerTombstoneEntity,
      PmTrackerHookEntity,
    ]),
  ],
  controllers: [PmTrackerController],
  providers: [
    PmTrackerService,
    ServerSyncService,
    SavePmTrackerStateHandler,
    ReportClientErrorHandler,
    CredentialCipherService,
    SaveCredentialHandler,
    DeleteCredentialHandler,
    ListCredentialsHandler,
    ResolveCredentialHandler,
    GetPmTrackerStateHandler,
    GetRecordsHandler,
    GetRecordsJsonHandler,
    MigrateStateToRecordsHandler,
    CommitRecordsHandler,
    SearchTasksHandler,
    ReleaseNoteTasksHandler,
  ],
})
export class PmTrackerModule {}
