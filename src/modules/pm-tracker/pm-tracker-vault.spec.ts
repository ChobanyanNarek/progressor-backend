import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';

import { SaveCredentialCommand } from './commands/save-credential/save-credential.command.ts';
import { SaveCredentialHandler } from './commands/save-credential/save-credential.handler.ts';
import {
  assertAllowedPath,
  GITHUB_PATHS,
  PmTrackerService,
} from './pm-tracker.service.ts';
import { ListCredentialsHandler } from './queries/list-credentials/list-credentials.handler.ts';
import { ListCredentialsQuery } from './queries/list-credentials/list-credentials.query.ts';

const USER = '11111111-1111-4111-8111-111111111111' as Uuid;

function service(resolved = 'vault-token'): PmTrackerService {
  return new PmTrackerService(
    { execute: jest.fn() } as never,
    { execute: jest.fn(() => Promise.resolve(resolved)) } as never,
  );
}

describe('assertAllowedPath', () => {
  // The real allow-list, not a copy, so this fails if it is ever loosened.
  const github = GITHUB_PATHS;

  it.each([
    '/repos/acme/web/pulls?state=open&per_page=100',
    '/repos/acme/web/pulls/42',
    '/orgs/acme/repos?type=all&page=2',
    '/users/narek/repos',
    '/search/issues?q=is:pr+author:narek',
  ])('allows the reads the app makes: %s', (path) => {
    expect(() => {
      assertAllowedPath(path, github);
    }).not.toThrow();
  });

  it.each([
    '/user', // the token owner's profile
    '/repos/acme/web/collaborators', // not a pull-request read
    '/repos/acme/web/pulls/42/merge', // a write endpoint
    '/repos/acme/../../user', // traversal
    'https://evil.example/steal', // another host
  ])('refuses anything else: %s', (path) => {
    expect(() => {
      assertAllowedPath(path, github);
    }).toThrow(BadRequestException);
  });
});

describe('PmTrackerService.withResolvedToken', () => {
  it('uses a token the client still holds', async () => {
    const resolved = await service().withResolvedToken(USER, {
      token: 'client',
    });

    expect(resolved.token).toBe('client');
  });

  it('decrypts from the vault by connection id otherwise', async () => {
    const resolved = await service('from-vault').withResolvedToken(USER, {
      connectionId: 'j_mab',
    });

    expect(resolved.token).toBe('from-vault');
  });

  it('requires one or the other', async () => {
    await expect(service().withResolvedToken(USER, {})).rejects.toThrow(
      BadRequestException,
    );
  });
});

describe('provider proxies', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn(() =>
      Promise.resolve({
        status: 200,
        json: () => Promise.resolve([{ id: 1 }]),
      }),
    );
    globalThis.fetch = fetchMock as never;
  });

  it('sends GitHub reads to api.github.com with the vaulted token', async () => {
    const res = await service('gh-token').githubProxy(USER, {
      path: '/repos/acme/web/pulls?state=open',
      connectionId: 'gh_1',
    } as never);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toBe('https://api.github.com/repos/acme/web/pulls?state=open');
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer gh-token',
    );
    expect(res.status).toBe(200);
  });

  it('sends GitLab reads to gitlab.com with the vaulted token', async () => {
    await service('gl-token').gitlabProxy(USER, {
      path: '/api/v4/groups/acme%2Fweb/merge_requests?state=opened',
      connectionId: 'gl_1',
    } as never);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toBe(
      'https://gitlab.com/api/v4/groups/acme%2Fweb/merge_requests?state=opened',
    );
    expect((init.headers as Record<string, string>)['PRIVATE-TOKEN']).toBe(
      'gl-token',
    );
  });

  it('never calls out for a path outside the allow-list', async () => {
    await expect(
      service().githubProxy(USER, {
        path: '/user',
        connectionId: 'gh_1',
      } as never),
    ).rejects.toThrow(BadRequestException);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('credential handlers', () => {
  it('rejects an unknown provider before encrypting anything', async () => {
    const encrypt = jest.fn();
    const handler = new SaveCredentialHandler(
      { upsert: jest.fn() } as never,
      {
        encrypt,
      } as never,
    );

    await expect(
      handler.execute(new SaveCredentialCommand(USER, 'x', 'bitbucket', 't')),
    ).rejects.toThrow(BadRequestException);
    expect(encrypt).not.toHaveBeenCalled();
  });

  it('stores only the encrypted envelope', async () => {
    const upsert = jest.fn();
    const handler = new SaveCredentialHandler(
      { upsert } as never,
      {
        encrypt: (s: string) => `v1.enc(${s})`,
      } as never,
    );

    await handler.execute(
      new SaveCredentialCommand(USER, 'j_mab', 'jira', ' tok '),
    );

    expect(upsert).toHaveBeenCalledWith(
      {
        userId: USER,
        connectionId: 'j_mab',
        provider: 'jira',
        secret: 'v1.enc(tok)',
      },
      ['userId', 'connectionId'],
    );
  });

  it('never selects the secret column when listing', async () => {
    const select = jest.fn();
    const qb: Record<string, unknown> = {
      select: select.mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(() => Promise.resolve([])),
    };
    const handler = new ListCredentialsHandler(
      { createQueryBuilder: () => qb } as never,
      { isAvailable: true } as never,
    );

    await handler.execute(new ListCredentialsQuery(USER));

    expect((select.mock.calls[0] as [string[]])[0]).not.toContain('c.secret');
  });
});
