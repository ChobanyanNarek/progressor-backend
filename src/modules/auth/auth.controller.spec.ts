import { describe, expect, it, jest } from '@jest/globals';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';

import type { ApiConfigService } from '../../shared/services/api-config.service.ts';
import { AuthController } from './auth.controller.ts';
import type { AuthService } from './auth.service.ts';

/*
 * The /auth/init-* routes promote an account to super admin, or set its password, with
 * no session of any kind behind them. The secret that gated them was a literal in this
 * controller, so every copy of the repository was a key to the production account list.
 * What matters most here is the missing-value case: a gate that opens when its secret is
 * unset is worse than no gate, because nothing looks wrong.
 */

const SECRET = 'a-secret-that-lives-in-the-environment';

function controller(bootstrapSecret?: string): AuthController {
  return new AuthController(
    {} as AuthService,
    {
      bootstrapSecret,
    } as ApiConfigService,
  );
}

const call = (c: AuthController, secret?: string): Promise<void> =>
  c.initSuperAdmin(secret!, 'someone@example.com');

describe('the bootstrap routes', () => {
  it('are not there at all when no secret is configured', async () => {
    await expect(call(controller(), SECRET)).rejects.toThrow(NotFoundException);
  });

  it('stay shut when the secret is blank rather than absent', async () => {
    await expect(call(controller(''), '')).rejects.toThrow(NotFoundException);
  });

  it('refuse a wrong secret', async () => {
    await expect(call(controller(SECRET), 'wrong')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('refuse a secret that is merely a prefix of the real one', async () => {
    await expect(call(controller(SECRET), SECRET.slice(0, 10))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('refuse a missing header', async () => {
    await expect(call(controller(SECRET))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('let the right secret through to the service', async () => {
    const promoteToSuperAdmin = jest.fn<(email: string) => Promise<void>>();
    const c = new AuthController(
      { promoteToSuperAdmin } as never,
      {
        bootstrapSecret: SECRET,
      } as ApiConfigService,
    );

    await c.initSuperAdmin(SECRET, 'someone@example.com');

    expect(promoteToSuperAdmin).toHaveBeenCalledWith('someone@example.com');
  });

  it('carries no secret of its own in the source', async () => {
    const { readFile } = await import('node:fs/promises');
    const source = await readFile(
      new URL('auth.controller.ts', import.meta.url),
      'utf8',
    );

    expect(source).not.toMatch(/[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}/);
  });
});
