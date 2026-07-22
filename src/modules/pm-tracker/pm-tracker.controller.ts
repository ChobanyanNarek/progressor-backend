import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { RoleType } from '../../constants/role-type.ts';
import { AuthUser } from '../../decorators/auth-user.decorator.ts';
import { Auth } from '../../decorators/http.decorators.ts';
import type { UserEntity } from '../user/user.entity.ts';
import {
  JiraBoardsRequestDto,
  JiraSearchRequestDto,
  JiraSearchResultDto,
  JiraSprintsRequestDto,
  JiraStatusesRequestDto,
} from './dtos/jira-proxy.dto.ts';
import type { PmTrackerStateDto } from './dtos/pm-tracker-state.dto.ts';
import type { SavePmTrackerStateDto } from './dtos/save-pm-tracker-state.dto.ts';
import { PmTrackerService } from './pm-tracker.service.ts';

@Controller('pm-tracker')
@ApiTags('pm-tracker')
export class PmTrackerController {
  constructor(private readonly pmTrackerService: PmTrackerService) {}

  @Get('state')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get pm-tracker state for the authenticated user' })
  @Auth([RoleType.CREATOR, RoleType.ADMIN])
  async getState(
    @AuthUser() user: UserEntity,
  ): Promise<PmTrackerStateDto | null> {
    const entity = await this.pmTrackerService.getState(user.id);

    if (!entity) {
      throw new NotFoundException('No state found');
    }

    return entity.toDto();
  }

  @Put('state')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save pm-tracker state for the authenticated user' })
  @Auth([RoleType.CREATOR, RoleType.ADMIN])
  saveState(
    @AuthUser() user: UserEntity,
    @Body() data: Record<string, unknown>,
  ): Promise<SavePmTrackerStateDto> {
    return this.pmTrackerService.saveState(user.id, data);
  }

  @Post('jira-search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Proxy a Jira issue search to avoid browser CORS restrictions',
  })
  @Auth([RoleType.CREATOR, RoleType.ADMIN])
  jiraSearch(@Body() dto: JiraSearchRequestDto): Promise<JiraSearchResultDto> {
    return this.pmTrackerService.jiraSearch(dto);
  }

  @Post('jira-statuses')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch all Jira statuses for a workspace to build status mappings',
  })
  @Auth([RoleType.CREATOR, RoleType.ADMIN])
  jiraStatuses(
    @Body() dto: JiraStatusesRequestDto,
  ): Promise<Array<Record<string, unknown>>> {
    return this.pmTrackerService.jiraStatuses(dto);
  }

  @Post('jira-boards')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch all Jira boards for a workspace to filter synced issues',
  })
  @Auth([RoleType.CREATOR, RoleType.ADMIN])
  jiraBoards(
    @Body() dto: JiraBoardsRequestDto,
  ): Promise<Array<Record<string, unknown>>> {
    return this.pmTrackerService.jiraBoards(dto);
  }

  @Post('jira-sprints')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch active/future sprints for a Jira board',
  })
  @Auth([RoleType.CREATOR, RoleType.ADMIN])
  jiraSprints(
    @Body() dto: JiraSprintsRequestDto,
  ): Promise<Array<Record<string, unknown>>> {
    return this.pmTrackerService.jiraSprints(dto);
  }
}
