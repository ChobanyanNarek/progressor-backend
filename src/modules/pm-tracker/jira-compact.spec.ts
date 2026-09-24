import { describe, expect, it } from '@jest/globals';

import { compactJiraIssue } from './pm-tracker.service.ts';
import { type JiraIssueRaw, rawToJiraItem } from './sync-core/jira-api.ts';

/*
 * Trimming a Jira issue must not change what the tracker makes of it: the compact form,
 * run through the web app's own rawToJiraItem, gives exactly what the full one did.
 */

const status = (name: string, key: string): Record<string, unknown> => ({
  self: 'https://x.atlassian.net/rest/api/3/status/3',
  description: '',
  iconUrl: 'https://x.atlassian.net/',
  name,
  id: '3',
  statusCategory: {
    self: 'https://x',
    id: 4,
    key,
    colorName: 'yellow',
    name: 'In Progress',
  },
});
const person = {
  self: 'https://x/user',
  accountId: 'abc',
  emailAddress: 'dev@x.com',
  avatarUrls: { large: 'https://a/48' },
  displayName: 'Dev',
  active: true,
  timeZone: 'Asia/Yerevan',
};

const full = {
  expand: 'renderedFields',
  id: '10001',
  self: 'https://x.atlassian.net/rest/api/3/issue/10001',
  key: 'COM-1',
  fields: {
    summary: 'Fix the login',
    status: status('Code Review', 'indeterminate'),
    priority: {
      self: 'https://x/p',
      iconUrl: 'https://x/i',
      name: 'High',
      id: '2',
    },
    duedate: '2026-10-01',
    assignee: person,
    created: '2026-09-01T10:00:00.000+0400',
    timeoriginalestimate: 7200,
    timespent: 3600,
    // biome-ignore lint/style/useNamingConvention: Jira's own field name
    customfield_10016: 5,
    // biome-ignore lint/style/useNamingConvention: Jira's own field name
    customfield_10028: null,
    issuetype: {
      self: 'https://x/t',
      id: '1',
      iconUrl: 'https://x/icon.svg',
      name: 'Bug',
      subtask: false,
    },
    parent: {
      id: '9',
      key: 'COM-9',
      self: 'https://x',
      fields: { summary: 'Epic', status: status('Open', 'new') },
    },
  },
  changelog: {
    startAt: 0,
    total: 3,
    histories: [
      {
        id: '1',
        author: person,
        created: '2026-09-02T10:00:00.000+0400',
        items: [
          {
            field: 'status',
            fieldtype: 'jira',
            from: '1',
            fromString: 'To Do',
            to: '3',
            toString: 'In Progress',
          },
        ],
      },
      {
        id: '2',
        author: person,
        created: '2026-09-03T10:00:00.000+0400',
        items: [
          {
            field: 'assignee',
            fieldtype: 'jira',
            fromString: 'A',
            toString: 'B',
          },
        ],
      },
      {
        id: '3',
        author: person,
        created: '2026-09-04T10:00:00.000+0400',
        items: [
          { field: 'priority', fromString: 'Low', toString: 'High' },
          {
            field: 'status',
            fromString: 'In Progress',
            toString: 'Code Review',
          },
        ],
      },
    ],
  },
};

const mappings = [
  { jiraStatus: 'To Do', groupId: 'todo' },
  { jiraStatus: 'In Progress', groupId: 'inprogress' },
  { jiraStatus: 'Code Review', groupId: 'review' },
];

const asTracker = (issue: unknown): ReturnType<typeof rawToJiraItem> =>
  rawToJiraItem(
    issue as JiraIssueRaw,
    'https://x.atlassian.net',
    mappings as never,
    7,
  );

describe('compactJiraIssue', () => {
  it('gives the tracker exactly the same issue', () => {
    expect(asTracker(compactJiraIssue(full))).toEqual(asTracker(full));
  });

  it('keeps status history built only from status changes', () => {
    const history = asTracker(compactJiraIssue(full)).statusHistory!;

    // Created, then the two status changes; the assignee and priority changes are gone.
    expect(history.map((h) => h.at)).toEqual([
      '2026-09-01T10:00:00.000+0400',
      '2026-09-02T10:00:00.000+0400',
      '2026-09-04T10:00:00.000+0400',
    ]);
  });

  it('copes with the fields Jira leaves out or sends as null', () => {
    const sparse = {
      key: 'COM-2',
      fields: {
        summary: 'x',
        status: status('To Do', 'new'),
        priority: null,
        assignee: null,
        parent: undefined,
      },
    };

    expect(asTracker(compactJiraIssue(sparse))).toEqual(asTracker(sparse));
  });

  it('is a small fraction of the full issue', () => {
    expect(JSON.stringify(compactJiraIssue(full)).length).toBeLessThan(
      JSON.stringify(full).length / 3,
    );
  });
});
