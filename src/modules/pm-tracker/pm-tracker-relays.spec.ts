import { describe, expect, it } from '@jest/globals';

import { PmTrackerController } from './pm-tracker.controller.ts';

/*
 * The provider relays send the service's answer as plain JSON, untouched, instead of
 * through the global serializer (whose class-transformer walk over megabyte Jira and
 * GitHub responses blocked the instance past Render's health check).
 */

const USER = { id: '11111111-1111-4111-8111-111111111111' } as never;

interface IFakeResponse {
  type: (contentType: string) => IFakeResponse;
  send: (body: string) => IFakeResponse;
  contentType?: string;
  sent?: string;
}

function fakeResponse(): IFakeResponse {
  const res: IFakeResponse = {
    type: (contentType) => {
      res.contentType = contentType;

      return res;
    },
    send: (body) => {
      res.sent = body;

      return res;
    },
  };

  return res;
}

const jiraAnswer = {
  issues: [
    {
      key: 'COM-1',
      fields: { summary: 'x', parent: null, nested: [1, { deep: true }] },
    },
  ],
  truncated: false,
};
const githubAnswer = {
  status: 200,
  data: [{ id: 1, head: { ref: 'feature/COM-1' }, merged_at: null }],
};

function controller(): PmTrackerController {
  const service = {
    withResolvedToken: (_userId: unknown, dto: object) =>
      Promise.resolve({ ...dto, token: 't' }),
    jiraSearch: () => Promise.resolve(jiraAnswer),
    jiraBoardIssues: () => Promise.resolve(jiraAnswer),
    githubProxy: () => Promise.resolve(githubAnswer),
    gitlabProxy: () => Promise.resolve(githubAnswer),
  };

  return new PmTrackerController(service as never, {} as never);
}

type Route = 'jiraSearch' | 'jiraBoardIssues' | 'githubProxy' | 'gitlabProxy';

const cases: Array<[Route, unknown]> = [
  ['jiraSearch', jiraAnswer],
  ['jiraBoardIssues', jiraAnswer],
  ['githubProxy', githubAnswer],
  ['gitlabProxy', githubAnswer],
];

describe('provider relays', () => {
  it.each(cases)(
    '%s sends the answer as plain JSON, unchanged',
    async (route, expected) => {
      const res = fakeResponse();
      const handler = controller()[route].bind(controller()) as (
        user: unknown,
        dto: unknown,
        response: unknown,
      ) => Promise<void>;

      await handler(USER, {}, res);

      expect(res.contentType).toBe('application/json');
      expect(JSON.parse(res.sent ?? 'null')).toEqual(expected);
    },
  );
});
