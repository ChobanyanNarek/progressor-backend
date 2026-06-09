import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import type { PageDto } from '../../common/dto/page.dto.ts';
import { RoleType } from '../../constants/role-type.ts';
import { ApiPageResponse } from '../../decorators/api-page-response.decorator.ts';
import { Auth } from '../../decorators/http.decorators.ts';
import { AdminLogsService } from './admin-logs.service.ts';
import { AdminLogEntryDto } from './dtos/admin-log-entry.dto.ts';
import { AdminLogOptionsDto } from './dtos/admin-log-options.dto.ts';

@Controller('admin/logs')
@ApiTags('admin-logs')
export class AdminLogsController {
  constructor(private readonly adminLogsService: AdminLogsService) {}

  @Get()
  @Auth([RoleType.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List admin logs with filters' })
  @ApiPageResponse({ description: 'Admin log entries', type: AdminLogEntryDto })
  getLogs(
    @Query() optionsDto: AdminLogOptionsDto,
  ): Promise<PageDto<AdminLogEntryDto>> {
    return this.adminLogsService.getLogs(optionsDto);
  }
}
