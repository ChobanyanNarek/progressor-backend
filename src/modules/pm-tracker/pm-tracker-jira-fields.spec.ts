import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { PmTrackerService } from './pm-tracker.service.ts';

/**
 * The tracker nests Jira subtasks under their parent, which needs `fields.parent` on
 * every issue. Jira only returns the fields we ask for, so a dropped `parent` in the
 * field list silently flattens the hierarchy in the UI with no error anywhere — exactly
 * the kind of regression a test has to catch.
 */
const BASE_URL = 'https://example.atlassian.net';
const CREDS = { baseUrl: BASE_URL, email: 'a@b.c', token: 't' };

function service(): PmTrackerService {
  // Only the Jira proxy methods are exercised here; they never touch the buses.

  return new PmTrackerService(
    { execute: jest.fn() } as never,
    { execute: jest.fn() } as never,
  );
}

function requestedFields(call: unknown): string[] {
  const url = new URL(String(call));

  return (url.searchParams.get('fields') ?? '').split(',').filter(Boolean);
}

describe('PmTrackerService Jira field list', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ issues: [], isLast: true }),
        text: () => Promise.resolve(''),
      }),
    ) as never;
    globalThis.fetch = fetchMock as never;
  });

  it('asks Jira for the parent field when searching issues', async () => {
    await service().jiraSearch({ ...CREDS, jql: 'project = MIN' } as never);

    expect(fetchMock).toHaveBeenCalled();
    const fields = requestedFields(fetchMock.mock.calls[0]![0]);
    expect(fields).toContain('parent');
  });

  it('asks Jira for the parent field when fetching board issues', async () => {
    await service().jiraBoardIssues({
      ...CREDS,
      boardId: 12,
      assigneeEmail: 'dev@example.com',
    } as never);

    expect(fetchMock).toHaveBeenCalled();
    const fields = requestedFields(fetchMock.mock.calls[0]![0]);
    expect(fields).toContain('parent');
  });

  it('keeps the fields the tracker already depends on', async () => {
    await service().jiraSearch({ ...CREDS, jql: 'project = MIN' } as never);

    const fields = requestedFields(fetchMock.mock.calls[0]![0]);

    for (const required of [
      'summary',
      'status',
      'assignee',
      'duedate',
      'issuetype',
    ]) {
      expect(fields).toContain(required);
    }
  });
});

describe('PmTrackerService issue cap', () => {
  it('accumulates well past 400 issues before truncating', async () => {
    // Jira orders by `updated DESC`, so a cap that is too low silently drops an open,
    // assigned issue off the end and it looks like the issue does not exist at all.
    const pageOf = (n: number) =>
      Array.from({ length: n }, (_, i) => ({ key: `COM-${i}`, fields: {} }));
    let calls = 0;
    const fetchMock = jest.fn(() => {
      calls += 1;

      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            issues: pageOf(50),
            isLast: false,
            nextPageToken: `t${calls}`,
          }),
        text: () => Promise.resolve(''),
      });
    });
    globalThis.fetch = fetchMock as never;

    const result = await service().jiraSearch({
      ...CREDS,
      jql: 'project = COM',
    } as never);

    expect(result.issues.length).toBeGreaterThan(400);
    expect(result.truncated).toBe(true);
  });
});
