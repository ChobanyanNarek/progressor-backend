import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminLogEntryEntity } from './admin-log-entry.entity.ts';
import { AdminLogsController } from './admin-logs.controller.ts';
import { AdminLogsService } from './admin-logs.service.ts';
import { GetAdminLogsHandler } from './queries/get-admin-logs/get-admin-logs.handler.ts';

const queryHandlers = [GetAdminLogsHandler];

@Module({
  imports: [TypeOrmModule.forFeature([AdminLogEntryEntity]), CqrsModule],
  controllers: [AdminLogsController],
  providers: [AdminLogsService, ...queryHandlers],
  /*
   * Exported so producer modules (did/auth) and the query-failed filter can
   * inject the record() writer. The repo stays private to this module.
   */
  exports: [AdminLogsService],
})
export class AdminLogsModule {}
