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
      fields: 'summary,status,priority,duedate,assignee,created',
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

  async jiraBoardIssues(
    dto: JiraBoardIssuesRequestDto,
  ): Promise<JiraSearchResultDto> {
    const { baseUrl, email, token, boardId, assigneeEmail } = dto;

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

    const issues: Array<Record<string, unknown>> = [];
    let startAt = 0;
    const maxResults = 100;

    while (true) {
      const params = new URLSearchParams({
        startAt: String(startAt),
        maxResults: String(maxResults),
        fields: 'summary,status,priority,duedate,assignee,created',
        expand: 'changelog',
      });
      if (assigneeEmail) {
        params.set('jql', `assignee = "${assigneeEmail}" AND statusCategory != Done`);
      } else {
        params.set('jql', 'statusCategory != Done');
      }
      const url = `${baseUrl.replace(/\/$/, '')}/rest/agile/1.0/board/${boardId}/issue?${params.toString()}`;
      const res = await fetch(url, { headers });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new HttpException(text || res.statusText, res.status);
      }

      const data = (await res.json()) as {
        issues?: Array<Record<string, unknown>>;
        total?: number;
      };

      issues.push(...(data.issues ?? []));

      if (issues.length >= (data.total ?? 0) || !(data.issues?.length)) break;
      startAt += maxResults;
    }

    return { issues } as JiraSearchResultDto;
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
