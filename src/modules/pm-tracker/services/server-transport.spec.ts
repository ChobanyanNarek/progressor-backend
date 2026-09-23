import { describe, expect, it, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';

import { assertAtlassianUrl } from '../pm-tracker.service.ts';
import { serverTransport } from './server-transport.ts';

const USER = '11111111-1111-4111-8111-111111111111' as Uuid;

describe('assertAtlassianUrl', () => {
  it.each([
    'https://mabrook.atlassian.net',
    'https://mabrook.atlassian.net/',
    'https://a-b.atlassian.net/jira',
  ])('accepts an Atlassian Cloud site: %s', (url) => {
    expect(() => {
      assertAtlassianUrl(url);
    }).not.toThrow();
  });

  it.each([
    'https://evil.example/?atlassian.net', // passed the old substring check
    'https://atlassian.net.evil.example',
    'https://evilatlassian.net',
    // eslint-disable-next-line sonarjs/no-clear-text-protocols -- refusing plain http is what is tested
    'http://mabrook.atlassian.net', // credentials in the clear
    'mabrook.atlassian.net',
    // eslint-disable-next-line sonarjs/no-clear-text-protocols -- refusing plain http is what is tested
    'http://169.254.169.254/latest/meta-data',
  ])('refuses anything else: %s', (url) => {
    expect(() => {
      assertAtlassianUrl(url);
    }).toThrow(BadRequestException);
  });
});

// Just the service methods these routes call.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- the mocks' own types are the point
function service() {
  return {
    withResolvedToken: jest.fn((_userId: Uuid, dto: Record<string, unknown>) =>
      Promise.resolve({ ...dto, token: 'vault-token' }),
    ),
    jiraSearch: jest.fn((dto: Record<string, unknown>) =>
      Promise.resolve({
        issues: [{ key: 'COM-1' }],
        truncated: false,
        echoedToken: dto.token,
      }),
    ),
    githubProxy: jest.fn(() =>
      Promise.reject(new BadRequestException('error.proxyPathNotAllowed')),
    ),
  };
}

describe('serverTransport', () => {
  const body = {
    baseUrl: 'https://mab.atlassian.net',
    email: 'a@b.c',
    connectionId: 'j1',
    jql: 'order by updated',
  };

  it("resolves the credential under this user and returns the service's answer as JSON", async () => {
    const svc = service();
    const res = await serverTransport(svc as never, USER).post(
      '/pm-tracker/jira-search',
      body,
    );

    expect(res.ok).toBe(true);
    await expect(res.json()).resolves.toEqual({
      issues: [{ key: 'COM-1' }],
      truncated: false,
      echoedToken: 'vault-token',
    });
    expect(svc.withResolvedToken).toHaveBeenCalledWith(
      USER,
      expect.objectContaining({ connectionId: 'j1' }),
    );
  });

  it('validates like the HTTP route: a missing field is a 422 and nothing is called', async () => {
    const svc = service();
    const res = await serverTransport(svc as never, USER).post(
      '/pm-tracker/jira-search',
      { ...body, jql: undefined },
    );

    expect(res.status).toBe(422);
    expect(svc.jiraSearch).not.toHaveBeenCalled();
  });

  it('passes an HTTP error through with its own status', async () => {
    const res = await serverTransport(service() as never, USER).post(
      '/pm-tracker/github',
      { path: '/user', connectionId: 'g1' },
    );

    expect(res.status).toBe(400);
    await expect(res.text()).resolves.toContain('error.proxyPathNotAllowed');
  });

  it('answers 404 for a route it does not know', async () => {
    const res = await serverTransport(service() as never, USER).post(
      '/pm-tracker/state',
      {},
    );

    expect(res.status).toBe(404);
  });
});
