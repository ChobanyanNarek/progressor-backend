import { jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';

import { AccountStatus } from '../../constants/account-status.ts';
import { RoleType } from '../../constants/role-type.ts';
import { TokenType } from '../../constants/token-type.ts';
import type { UserEntity } from '../user/user.entity.ts';
import { JwtStrategy } from './jwt.strategy.ts';

describe('JwtStrategy', () => {
  let findOne: jest.Mock<() => Promise<UserEntity | null>>;
  let strategy: JwtStrategy;

  const args = {
    userId: 'user-1' as Uuid,
    role: RoleType.CREATOR,
    type: TokenType.ACCESS_TOKEN,
  };

  beforeEach(() => {
    findOne = jest.fn<() => Promise<UserEntity | null>>();

    strategy = new JwtStrategy(
      { authConfig: { publicKey: 'test-public-key' } } as never,
      { findOne } as never,
    );
  });

  it('returns the user for a valid ACCESS token on an ACTIVE account', async () => {
    const user = {
      id: 'user-1',
      status: AccountStatus.ACTIVE,
    } as UserEntity;
    findOne.mockResolvedValue(user);

    await expect(strategy.validate(args)).resolves.toBe(user);
  });

  it('rejects a non-ACCESS token type with 401', async () => {
    await expect(
      strategy.validate({ ...args, type: TokenType.REFRESH_TOKEN }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(findOne).not.toHaveBeenCalled();
  });

  it('rejects with 401 when the user no longer exists', async () => {
    findOne.mockResolvedValue(null);

    await expect(strategy.validate(args)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects a DISABLED account with a bare 401 (no state leak)', async () => {
    findOne.mockResolvedValue({
      id: 'user-1',
      status: AccountStatus.DISABLED,
    } as UserEntity);

    await expect(strategy.validate(args)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
