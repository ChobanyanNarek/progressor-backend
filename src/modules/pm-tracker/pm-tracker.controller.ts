import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

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
import { PmTrackerCredentialListDto } from './dtos/pm-tracker-credential-list.dto.ts';
import type { PmTrackerStateDto } from './dtos/pm-tracker-state.dto.ts';
import { PmTrackerTaskDto } from './dtos/pm-tracker-task.dto.ts';
import {
  GithubProxyRequestDto,
  GithubProxyResultDto,
  GitlabProxyRequestDto,
  GitlabProxyResultDto,
} from './dtos/provider-proxy.dto.ts';
import { ReleaseNoteTaskDto } from './dtos/release-note-task.dto.ts';
import { ReleaseNoteTasksPageOptionsDto } from './dtos/release-note-tasks-page-options.dto.ts';
import { ReportClientErrorDto } from './dtos/report-client-error.dto.ts';
import { SavePmTrackerCredentialDto } from './dtos/save-pm-tracker-credential.dto.ts';
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

  /*
   * Errors from users' browsers, recorded in the admin log for the admin panel. Throttled
   * per client so a page stuck in an error loop cannot flood the log; the client also
   * de-duplicates and caps what it sends.
   */
  @Post('client-errors')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Report an error raised in the web app' })
  @Auth([RoleType.CREATOR, RoleType.ADMIN])
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  reportClientError(
    @AuthUser() user: UserEntity,
    @Body() report: ReportClientErrorDto,
    @Headers('user-agent') userAgent: string | undefined,
  ): Promise<void> {
    return this.pmTrackerService.reportClientError(user.id, report, userAgent);
  }

  /*
   * Credential vault. Integration tokens are stored encrypted server-side and are never
   * returned: the list reports which connections have one, not what it is.
   */
  @Get('credentials')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List which connections have a stored token' })
  @Auth([RoleType.CREATOR, RoleType.ADMIN])
  listCredentials(
    @AuthUser() user: UserEntity,
  ): Promise<PmTrackerCredentialListDto> {
    return this.pmTrackerService.listCredentials(user.id);
  }

  @Put('credentials/:connectionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Store or replace the token for a connection' })
  @Auth([RoleType.CREATOR, RoleType.ADMIN])
  saveCredential(
    @AuthUser() user: UserEntity,
    @Param('connectionId') connectionId: string,
    @Body() dto: SavePmTrackerCredentialDto,
  ): Promise<void> {
    return this.pmTrackerService.saveCredential(user.id, connectionId, dto);
  }

  @Delete('credentials/:connectionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete the token for a connection' })
  @Auth([RoleType.CREATOR, RoleType.ADMIN])
  deleteCredential(
    @AuthUser() user: UserEntity,
    @Param('connectionId') connectionId: string,
  ): Promise<void> {
    return this.pmTrackerService.deleteCredential(user.id, connectionId);
  }

  @Post('github')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Proxy an allow-listed GitHub read with a vaulted token',
  })
  @Auth([RoleType.CREATOR, RoleType.ADMIN])
  githubProxy(
    @AuthUser() user: UserEntity,
    @Body() dto: GithubProxyRequestDto,
  ): Promise<GithubProxyResultDto> {
    return this.pmTrackerService.githubProxy(user.id, dto);
  }

  @Post('gitlab')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Proxy an allow-listed GitLab read with a vaulted token',
  })
  @Auth([RoleType.CREATOR, RoleType.ADMIN])
  gitlabProxy(
    @AuthUser() user: UserEntity,
    @Body() dto: GitlabProxyRequestDto,
  ): Promise<GitlabProxyResultDto> {
    return this.pmTrackerService.gitlabProxy(user.id, dto);
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
  async jiraSearch(
    @AuthUser() user: UserEntity,
    @Body() dto: JiraSearchRequestDto,
  ): Promise<JiraSearchResultDto> {
    return this.pmTrackerService.jiraSearch(
      await this.pmTrackerService.withResolvedToken(user.id, dto),
    );
  }

  @Post('jira-statuses')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch all Jira statuses for a workspace to build status mappings',
  })
  @Auth([RoleType.CREATOR, RoleType.ADMIN])
  async jiraStatuses(
    @AuthUser() user: UserEntity,
    @Body() dto: JiraStatusesRequestDto,
  ): Promise<Array<Record<string, unknown>>> {
    return this.pmTrackerService.jiraStatuses(
      await this.pmTrackerService.withResolvedToken(user.id, dto),
    );
  }

  @Post('jira-boards')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch all Jira boards for a workspace to filter synced issues',
  })
  @Auth([RoleType.CREATOR, RoleType.ADMIN])
  async jiraBoards(
    @AuthUser() user: UserEntity,
    @Body() dto: JiraBoardsRequestDto,
  ): Promise<Array<Record<string, unknown>>> {
    return this.pmTrackerService.jiraBoards(
      await this.pmTrackerService.withResolvedToken(user.id, dto),
    );
  }

  @Post('jira-board-issues')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Fetch issues from a Jira board for a specific assignee (active sprint)',
  })
  @Auth([RoleType.CREATOR, RoleType.ADMIN])
  async jiraBoardIssues(
    @AuthUser() user: UserEntity,
    @Body() dto: JiraBoardIssuesRequestDto,
  ): Promise<JiraSearchResultDto> {
    return this.pmTrackerService.jiraBoardIssues(
      await this.pmTrackerService.withResolvedToken(user.id, dto),
    );
  }

  @Post('jira-board-keys')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Fetch ALL issue keys on a Jira board (assignee-agnostic, sprint-agnostic, paginated) for board membership',
  })
  @Auth([RoleType.CREATOR, RoleType.ADMIN])
  async jiraBoardKeys(
    @AuthUser() user: UserEntity,
    @Body() dto: JiraSprintsRequestDto,
  ): Promise<{ keys: string[] }> {
    return this.pmTrackerService.jiraBoardKeys(
      await this.pmTrackerService.withResolvedToken(user.id, dto),
    );
  }

  @Post('jira-time-tracking')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch Jira time tracking configuration (workingHoursPerDay)',
  })
  @Auth([RoleType.CREATOR, RoleType.ADMIN])
  async jiraTimeTracking(
    @AuthUser() user: UserEntity,
    @Body() dto: JiraStatusesRequestDto,
  ): Promise<Record<string, unknown>> {
    return this.pmTrackerService.jiraTimeTracking(
      await this.pmTrackerService.withResolvedToken(user.id, dto),
    );
  }

  @Post('jira-sprints')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch active/future sprints for a Jira board',
  })
  @Auth([RoleType.CREATOR, RoleType.ADMIN])
  async jiraSprints(
    @AuthUser() user: UserEntity,
    @Body() dto: JiraSprintsRequestDto,
  ): Promise<Array<Record<string, unknown>>> {
    return this.pmTrackerService.jiraSprints(
      await this.pmTrackerService.withResolvedToken(user.id, dto),
    );
  }
}
