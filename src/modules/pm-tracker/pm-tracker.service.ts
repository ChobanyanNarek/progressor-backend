import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { SavePmTrackerStateCommand } from './commands/save-state/save-pm-tracker-state.command.ts';
import type {
  JiraSearchRequestDto,
  JiraSearchResultDto,
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
}
