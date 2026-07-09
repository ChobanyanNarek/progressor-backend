import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  JiraSearchRequestDto,
  JiraSearchResultDto,
} from './dtos/jira-proxy.dto.ts';
import type { PmTrackerStateDto } from './dtos/pm-tracker-state.dto.ts';
import type { SavePmTrackerStateDto } from './dtos/save-pm-tracker-state.dto.ts';
import { PmTrackerService } from './pm-tracker.service.ts';

const DEFAULT_WORKSPACE = 'default';

@Controller('pm-tracker')
@ApiTags('pm-tracker')
export class PmTrackerController {
  constructor(private readonly pmTrackerService: PmTrackerService) {}

  @Get('state')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get pm-tracker state' })
  async getState(
    @Query('workspace') workspace: string = DEFAULT_WORKSPACE,
  ): Promise<PmTrackerStateDto | null> {
    const entity = await this.pmTrackerService.getState(workspace);

    if (!entity) {
      throw new NotFoundException('No state found');
    }

    return entity.toDto();
  }

  @Put('state')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save pm-tracker state' })
  saveState(
    @Query('workspace') workspace: string = DEFAULT_WORKSPACE,
    @Body() data: Record<string, unknown>,
  ): Promise<SavePmTrackerStateDto> {
    return this.pmTrackerService.saveState(workspace, data);
  }

  @Post('jira-search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Proxy a Jira issue search to avoid browser CORS restrictions',
  })
  jiraSearch(@Body() dto: JiraSearchRequestDto): Promise<JiraSearchResultDto> {
    return this.pmTrackerService.jiraSearch(dto);
  }
}
