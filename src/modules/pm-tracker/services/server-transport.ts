import {
  HttpException,
  HttpStatus,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';

import {
  JiraBoardIssuesRequestDto,
  JiraSearchRequestDto,
  JiraSprintsRequestDto,
  JiraStatusesRequestDto,
} from '../dtos/jira-proxy.dto.ts';
import {
  GithubProxyRequestDto,
  GitlabProxyRequestDto,
} from '../dtos/provider-proxy.dto.ts';
import type { PmTrackerService } from '../pm-tracker.service.ts';
import type { Transport, TransportResponse } from '../sync-core/transport.ts';

/*
 * The same validation the HTTP routes apply (main.ts), so a server-side call is held to
 * exactly the rules a browser call is.
 */
const pipe = new ValidationPipe({
  whitelist: true,
  errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
  transform: true,
  dismissDefaultMessages: true,
  forbidNonWhitelisted: true,
  exceptionFactory: (errors) => new UnprocessableEntityException(errors),
});

function respond(status: number, body: unknown): TransportResponse {
  const text = JSON.stringify(body);

  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(JSON.parse(text) as unknown),
    text: () => Promise.resolve(text),
  };
}

type Route = (body: Record<string, unknown>) => Promise<unknown>;

async function validated<T extends object>(
  metatype: new () => T,
  body: Record<string, unknown>,
): Promise<T> {
  return (await pipe.transform(body, { type: 'body', metatype })) as T;
}

/*
 * The sync core's route to the provider endpoints when it runs on the server (ADR-0019):
 * the same service methods the HTTP routes call, validated the same way, with the
 * credential resolved under this user only. Answers are passed through JSON so the core
 * sees exactly what a browser would.
 */
export function serverTransport(
  service: PmTrackerService,
  userId: Uuid,
): Transport {
  // Keyed by API route, which is not an identifier.
  const routes = new Map<string, Route>([
    [
      '/pm-tracker/jira-search',
      async (body) =>
        service.jiraSearch(
          await service.withResolvedToken(
            userId,
            await validated(JiraSearchRequestDto, body),
          ),
        ),
    ],
    [
      '/pm-tracker/jira-board-issues',
      async (body) =>
        service.jiraBoardIssues(
          await service.withResolvedToken(
            userId,
            await validated(JiraBoardIssuesRequestDto, body),
          ),
        ),
    ],
    [
      '/pm-tracker/jira-board-keys',
      async (body) =>
        service.jiraBoardKeys(
          await service.withResolvedToken(
            userId,
            await validated(JiraSprintsRequestDto, body),
          ),
        ),
    ],
    [
      '/pm-tracker/jira-time-tracking',
      async (body) =>
        service.jiraTimeTracking(
          await service.withResolvedToken(
            userId,
            await validated(JiraStatusesRequestDto, body),
          ),
        ),
    ],
    [
      '/pm-tracker/github',
      async (body) =>
        service.githubProxy(
          userId,
          await validated(GithubProxyRequestDto, body),
        ),
    ],
    [
      '/pm-tracker/gitlab',
      async (body) =>
        service.gitlabProxy(
          userId,
          await validated(GitlabProxyRequestDto, body),
        ),
    ],
  ]);

  return {
    post: async (path, body) => {
      const route = routes.get(path);

      if (!route) {
        return respond(HttpStatus.NOT_FOUND, { message: 'error.notFound' });
      }

      try {
        return respond(HttpStatus.OK, await route(body));
      } catch (error) {
        if (error instanceof HttpException) {
          return respond(error.getStatus(), error.getResponse());
        }

        return respond(HttpStatus.BAD_GATEWAY, {
          message: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}
