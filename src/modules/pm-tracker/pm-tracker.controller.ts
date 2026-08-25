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
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import type { PageDto } from '../../common/dto/page.dto.ts';
import { RoleType } from '../../constants/role-type.ts';
import { ApiPageResponse } from '../../decorators/api-page-response.decorator.ts';
import { AuthUser } from '../../decorators/auth-user.decorator.ts';
import { Auth } from '../../decorators/http.decorators.ts';
import type { UserEntity } from '../user/user.entity.ts';
import {
  JiraBoardIssuesRequestDto,
  JiraBoardsRequestDto,
  JiraSearchRequestDto,
  JiraSearchResultDto,
  JiraSprintsRequestDto,
  JiraStatusesRequestDto,
} from './dtos/jira-proxy.dto.ts';
import type { PmTrackerStateDto } from './dtos/pm-tracker-state.dto.ts';
import { PmTrackerTaskDto } from './dtos/pm-tracker-task.dto.ts';
import { ReleaseNoteTaskDto } from './dtos/release-note-task.dto.ts';
import { ReleaseNoteTasksPageOptionsDto } from './dtos/release-note-tasks-page-options.dto.ts';
import type { SavePmTrackerStateDto } from './dtos/save-pm-tracker-state.dto.ts';
import { SearchTasksPageOptionsDto } from './dtos/search-tasks-page-options.dto.ts';
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

  @Get('tasks/search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Search the authenticated user's tasks and embedded Jira issues, paginated server-side",
  })
  @ApiPageResponse({
    description: 'Tasks matching the search term and filters',
    type: PmTrackerTaskDto,
  })
  @Auth([RoleType.CREATOR, RoleType.ADMIN])
  searchTasks(
    @AuthUser() user: UserEntity,
    @Query(new ValidationPipe({ transform: true }))
    pageOptionsDto: SearchTasksPageOptionsDto,
  ): Promise<PageDto<PmTrackerTaskDto>> {
    return this.pmTrackerService.searchTasks(user.id, pageOptionsDto);
  }

  @Get('tasks/release-notes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Fetch the authenticated user's tasks within a date range, paginated, for Release Notes views",
  })
  @ApiPageResponse({
    description: 'Tasks within the given date range and filters',
    type: ReleaseNoteTaskDto,
  })
  @Auth([RoleType.CREATOR, RoleType.ADMIN])
  releaseNoteTasks(
    @AuthUser() user: UserEntity,
    @Query(new ValidationPipe({ transform: true }))
    pageOptionsDto: ReleaseNoteTasksPageOptionsDto,
  ): Promise<PageDto<ReleaseNoteTaskDto>> {
    return this.pmTrackerService.releaseNoteTasks(user.id, pageOptionsDto);
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

  @Post('jira-board-issues')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Fetch issues from a Jira board for a specific assignee (active sprint)',
  })
  @Auth([RoleType.CREATOR, RoleType.ADMIN])
  jiraBoardIssues(
    @Body() dto: JiraBoardIssuesRequestDto,
  ): Promise<JiraSearchResultDto> {
    return this.pmTrackerService.jiraBoardIssues(dto);
  }

  @Post('jira-board-keys')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Fetch ALL issue keys on a Jira board (assignee-agnostic, sprint-agnostic, paginated) for board membership',
  })
  @Auth([RoleType.CREATOR, RoleType.ADMIN])
  jiraBoardKeys(
    @Body() dto: JiraSprintsRequestDto,
  ): Promise<{ keys: string[] }> {
    return this.pmTrackerService.jiraBoardKeys(dto);
  }

  @Post('jira-time-tracking')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch Jira time tracking configuration (workingHoursPerDay)',
  })
  @Auth([RoleType.CREATOR, RoleType.ADMIN])
  jiraTimeTracking(
    @Body() dto: JiraStatusesRequestDto,
  ): Promise<Record<string, unknown>> {
    return this.pmTrackerService.jiraTimeTracking(dto);
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
