import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { SavePmTrackerStateCommand } from './commands/save-state/save-pm-tracker-state.command.ts';
import type {
  JiraBoardIssuesRequestDto,
  JiraBoardsRequestDto,
  JiraSearchRequestDto,
  JiraSearchResultDto,
  JiraSprintsRequestDto,
  JiraStatusesRequestDto,
} from './dtos/jira-proxy.dto.ts';
import type { SavePmTrackerStateDto } from './dtos/save-pm-tracker-state.dto.ts';
import type { PmTrackerStateEntity } from './pm-tracker-state.entity.ts';
import { GetPmTrackerStateQuery } from './queries/get-state/get-pm-tracker-state.query.ts';

@Injectable()
export class PmTrackerService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  getState(userId: Uuid): Promise<PmTrackerStateEntity | null> {
    return this.queryBus.execute<
      GetPmTrackerStateQuery,
      PmTrackerStateEntity | null
    >(new GetPmTrackerStateQuery(userId));
  }

  saveState(
    userId: Uuid,
    data: Record<string, unknown>,
  ): Promise<SavePmTrackerStateDto> {
    return this.commandBus.execute<
      SavePmTrackerStateCommand,
      SavePmTrackerStateDto
    >(new SavePmTrackerStateCommand(userId, data));
  }

  async jiraSearch(dto: JiraSearchRequestDto): Promise<JiraSearchResultDto> {
    const { baseUrl, email, token, jql } = dto;

    if (!baseUrl.includes('atlassian.net')) {
      throw new BadRequestException(
        'Only Atlassian Cloud URLs (*.atlassian.net) are supported',
      );
    }

    const params = new URLSearchParams({
      jql,
      fields: 'summary,status,priority,duedate,assignee,created,timeoriginalestimate,timespent,customfield_10016,customfield_10028',
      maxResults: '100',
      expand: 'changelog',
    });

    const url = `${baseUrl.replace(/\/$/, '')}/rest/api/3/search/jql?${params.toString()}`;
    const auth = Buffer.from(`${email}:${token}`).toString('base64');

    const headers: Record<string, string> = {
      // biome-ignore lint/style/useNamingConvention: HTTP header names are PascalCase by spec
      Authorization: `Basic ${auth}`,
      // biome-ignore lint/style/useNamingConvention: HTTP header names are PascalCase by spec
      Accept: 'application/json',
    };

    const res = await fetch(url, { headers });

    if (!res.ok) {
      const text = await res.text().catch(() => '');

      throw new HttpException(text || res.statusText, res.status);
    }

    const data = (await res.json()) as {
      issues?: Array<Record<string, unknown>>;
    };

    return { issues: data.issues ?? [] } as JiraSearchResultDto;
  }

  async jiraTimeTracking(dto: JiraStatusesRequestDto): Promise<Record<string, unknown>> {
    const { baseUrl, email, token } = dto;

    if (!baseUrl.includes('atlassian.net')) {
      throw new BadRequestException('Only Atlassian Cloud URLs (*.atlassian.net) are supported');
    }

    const url = `${baseUrl.replace(/\/$/, '')}/rest/api/3/configuration/timetracking/options`;
    const auth = Buffer.from(`${email}:${token}`).toString('base64');
    const headers: Record<string, string> = {
      // biome-ignore lint/style/useNamingConvention: HTTP header names are PascalCase by spec
      Authorization: `Basic ${auth}`,
      // biome-ignore lint/style/useNamingConvention: HTTP header names are PascalCase by spec
      Accept: 'application/json',
    };

    const res = await fetch(url, { headers });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new HttpException(text || res.statusText, res.status);
    }
    return res.json() as Promise<Record<string, unknown>>;
  }

  async jiraStatuses(
    dto: JiraStatusesRequestDto,
  ): Promise<Array<Record<string, unknown>>> {
    const { baseUrl, email, token } = dto;

    if (!baseUrl.includes('atlassian.net')) {
      throw new BadRequestException(
        'Only Atlassian Cloud URLs (*.atlassian.net) are supported',
      );
    }

    const url = `${baseUrl.replace(/\/$/, '')}/rest/api/3/status`;
    const auth = Buffer.from(`${email}:${token}`).toString('base64');

    const headers: Record<string, string> = {
      // biome-ignore lint/style/useNamingConvention: HTTP header names are PascalCase by spec
      Authorization: `Basic ${auth}`,
      // biome-ignore lint/style/useNamingConvention: HTTP header names are PascalCase by spec
      Accept: 'application/json',
    };

    const res = await fetch(url, { headers });

    if (!res.ok) {
      const text = await res.text().catch(() => '');

      throw new HttpException(text || res.statusText, res.status);
    }

    return res.json() as Promise<Array<Record<string, unknown>>>;
  }

  async jiraBoards(
    dto: JiraBoardsRequestDto,
  ): Promise<Array<Record<string, unknown>>> {
    const { baseUrl, email, token } = dto;

    if (!baseUrl.includes('atlassian.net')) {
      throw new BadRequestException(
        'Only Atlassian Cloud URLs (*.atlassian.net) are supported',
      );
    }

    const auth = Buffer.from(`${email}:${token}`).toString('base64');
    const headers: Record<string, string> = {
      // biome-ignore lint/style/useNamingConvention: HTTP header names are PascalCase by spec
      Authorization: `Basic ${auth}`,
      // biome-ignore lint/style/useNamingConvention: HTTP header names are PascalCase by spec
      Accept: 'application/json',
    };

    const boards: Array<Record<string, unknown>> = [];
    let startAt = 0;
    const maxResults = 50;

    while (true) {
      const params = new URLSearchParams({
        startAt: String(startAt),
        maxResults: String(maxResults),
      });
      const url = `${baseUrl.replace(/\/$/, '')}/rest/agile/1.0/board?${params.toString()}`;
      const res = await fetch(url, { headers });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new HttpException(text || res.statusText, res.status);
      }

      const data = (await res.json()) as {
        values?: Array<Record<string, unknown>>;
        isLast?: boolean;
        total?: number;
      };

      boards.push(...(data.values ?? []));

      if (data.isLast || boards.length >= (data.total ?? 0)) break;
      startAt += maxResults;
    }

    return boards;
  }

  async jiraBoardIssues(dto: JiraBoardIssuesRequestDto): Promise<JiraSearchResultDto> {
    const { baseUrl, email, token, boardId, assigneeEmail } = dto;

    if (!baseUrl.includes('atlassian.net')) {
      throw new BadRequestException('Only Atlassian Cloud URLs (*.atlassian.net) are supported');
    }

    const auth = Buffer.from(`${email}:${token}`).toString('base64');
    const headers: Record<string, string> = {
      // biome-ignore lint/style/useNamingConvention: HTTP header names are PascalCase by spec
      Authorization: `Basic ${auth}`,
      // biome-ignore lint/style/useNamingConvention: HTTP header names are PascalCase by spec
      Accept: 'application/json',
    };

    // Use Agile board issues endpoint filtered by assignee, active sprint
    const params = new URLSearchParams({
      jql: `assignee = "${assigneeEmail}" AND sprint in openSprints()`,
      fields: 'summary,status,priority,duedate,assignee,created,timeoriginalestimate,timespent,customfield_10016,customfield_10028',
      maxResults: '100',
      expand: 'changelog',
    });
    const url = `${baseUrl.replace(/\/$/, '')}/rest/agile/1.0/board/${boardId}/issue?${params.toString()}`;
    const res = await fetch(url, { headers });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new HttpException(text || res.statusText, res.status);
    }

    const data = (await res.json()) as { issues?: Array<Record<string, unknown>> };
    return { issues: data.issues ?? [] } as JiraSearchResultDto;
  }

  // Return the FULL set of issue keys on a board — assignee-agnostic and sprint-agnostic,
  // fully paginated. This is the accurate board-membership signal used by the tracker to
  // decide which issues belong to a board. (jiraBoardIssues is intentionally narrower:
  // per-assignee, open-sprint only — it must NOT be used to resolve board membership.)
  async jiraBoardKeys(dto: JiraSprintsRequestDto): Promise<{ keys: string[] }> {
    const { baseUrl, email, token, boardId } = dto;

    if (!baseUrl.includes('atlassian.net')) {
      throw new BadRequestException('Only Atlassian Cloud URLs (*.atlassian.net) are supported');
    }

    const auth = Buffer.from(`${email}:${token}`).toString('base64');
    const headers: Record<string, string> = {
      // biome-ignore lint/style/useNamingConvention: HTTP header names are PascalCase by spec
      Authorization: `Basic ${auth}`,
      // biome-ignore lint/style/useNamingConvention: HTTP header names are PascalCase by spec
      Accept: 'application/json',
    };

    const keys = new Set<string>();
    let startAt = 0;
    const maxResults = 100;

    while (true) {
      const params = new URLSearchParams({
        // no JQL filter: every issue on the board, any assignee, any sprint/backlog
        fields: 'key',
        startAt: String(startAt),
        maxResults: String(maxResults),
      });
      const url = `${baseUrl.replace(/\/$/, '')}/rest/agile/1.0/board/${boardId}/issue?${params.toString()}`;
      const res = await fetch(url, { headers });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new HttpException(text || res.statusText, res.status);
      }

      const data = (await res.json()) as {
        issues?: Array<{ key?: string }>;
        total?: number;
      };
      const issues = data.issues ?? [];
      for (const issue of issues) {
        if (issue.key) keys.add(issue.key.toUpperCase());
      }

      startAt += maxResults;
      if (issues.length < maxResults || startAt >= (data.total ?? 0)) break;
    }

    return { keys: [...keys] };
  }

  async jiraSprints(
    dto: JiraSprintsRequestDto,
  ): Promise<Array<Record<string, unknown>>> {
    const { baseUrl, email, token, boardId } = dto;

    if (!baseUrl.includes('atlassian.net')) {
      throw new BadRequestException(
        'Only Atlassian Cloud URLs (*.atlassian.net) are supported',
      );
    }

    const auth = Buffer.from(`${email}:${token}`).toString('base64');
    const headers: Record<string, string> = {
      // biome-ignore lint/style/useNamingConvention: HTTP header names are PascalCase by spec
      Authorization: `Basic ${auth}`,
      // biome-ignore lint/style/useNamingConvention: HTTP header names are PascalCase by spec
      Accept: 'application/json',
    };

    const params = new URLSearchParams({ state: 'active,future', maxResults: '50' });
    const url = `${baseUrl.replace(/\/$/, '')}/rest/agile/1.0/board/${boardId}/sprint?${params.toString()}`;
    const res = await fetch(url, { headers });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new HttpException(text || res.statusText, res.status);
    }

    const data = (await res.json()) as { values?: Array<Record<string, unknown>> };
    return data.values ?? [];
  }
}
