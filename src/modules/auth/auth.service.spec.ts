import { jest } from '@jest/globals';

import { generateHash } from '../../common/utils.ts';
import { AccountStatus } from '../../constants/account-status.ts';
import { LogLevel } from '../../constants/log-level.ts';
import { LogSource } from '../../constants/log-source.ts';
import { RoleType } from '../../constants/role-type.ts';
import { TokenType } from '../../constants/token-type.ts';
import { AccountDisabledException } from '../../exceptions/account-disabled.exception.ts';
import { InvalidCredentialsException } from '../../exceptions/invalid-credentials.exception.ts';
import { UserNotFoundException } from '../../exceptions/user-not-found.exception.ts';
import type { UserEntity } from '../user/user.entity.ts';
import { AuthService } from './auth.service.ts';
import type { UserLoginDto } from './dto/user-login.dto.ts';

describe('AuthService', () => {
  const jwtExpirationTime = 86_400;

  let signAsync: jest.Mock<() => Promise<string>>;
  let findOne: jest.Mock<() => Promise<UserEntity | null>>;
  let update: jest.Mock<() => Promise<void>>;
  let record: jest.Mock;
  let service: AuthService;

  beforeEach(() => {
    signAsync = jest
      .fn<() => Promise<string>>()
      .mockResolvedValue('signed.jwt');
    findOne = jest.fn<() => Promise<UserEntity | null>>();
    update = jest.fn<() => Promise<void>>().mockResolvedValue();
    record = jest.fn();

    service = new AuthService(
      { signAsync } as never,
      { authConfig: { jwtExpirationTime } } as never,
      { findOne, update } as never,
      { record } as never,
    );
  });

  describe('createAccessToken', () => {
    it('signs the token with an expiresIn so the JWT carries an exp claim', async () => {
      const userId = 'user-1' as Uuid;

      const result = await service.createAccessToken({
        userId,
        role: RoleType.ADMIN,
      });

      expect(signAsync).toHaveBeenCalledWith(
        { userId, type: TokenType.ACCESS_TOKEN, role: RoleType.ADMIN },
        { expiresIn: jwtExpirationTime },
      );
      expect(result.expiresIn).toBe(jwtExpirationTime);
      expect(result.token).toBe('signed.jwt');
    });
  });

  describe('validateUser', () => {
    const loginDto = {
      email: 'john@test.com',
      password: 'correct-horse',
    } as UserLoginDto;

    it('throws UserNotFoundException (404) for an unknown email', async () => {
      findOne.mockResolvedValue(null);

      await expect(service.validateUser(loginDto)).rejects.toBeInstanceOf(
        UserNotFoundException,
      );
      expect(update).not.toHaveBeenCalled();
      expect(record).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.WARN,
          source: LogSource.AUTH,
          context: { email: loginDto.email },
        }),
      );
    });

    it('throws InvalidCredentialsException (401) for a real user with a wrong password', async () => {
      findOne.mockResolvedValue({
        id: 'user-1',
        status: AccountStatus.ACTIVE,
        password: generateHash('a-different-password'),
      } as UserEntity);

      await expect(service.validateUser(loginDto)).rejects.toBeInstanceOf(
        InvalidCredentialsException,
      );
      expect(update).not.toHaveBeenCalled();
      expect(record).toHaveBeenCalledWith(
        expect.objectContaining({ level: LogLevel.WARN }),
      );
    });

    it('throws AccountDisabledException (403) for a DISABLED account with a correct password', async () => {
      findOne.mockResolvedValue({
        id: 'user-1',
        status: AccountStatus.DISABLED,
        password: generateHash(loginDto.password),
      } as UserEntity);

      await expect(service.validateUser(loginDto)).rejects.toBeInstanceOf(
        AccountDisabledException,
      );
      // A disabled account must never obtain a token / refresh its lastLogin.
      expect(update).not.toHaveBeenCalled();
      expect(record).toHaveBeenCalledWith(
        expect.objectContaining({ level: LogLevel.WARN }),
      );
    });

    it('returns the user and stamps lastLogin on valid credentials', async () => {
      const user = {
        id: 'user-1',
        role: RoleType.CREATOR,
        status: AccountStatus.ACTIVE,
        password: generateHash(loginDto.password),
      } as UserEntity;
      findOne.mockResolvedValue(user);

      const result = await service.validateUser(loginDto);

      expect(result).toBe(user);
      expect(update).toHaveBeenCalledWith('user-1', {
        lastLogin: expect.any(Date),
      });
      expect(record).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.INFO,
          source: LogSource.AUTH,
          context: { userId: 'user-1', role: RoleType.CREATOR },
        }),
      );
    });
  });
});
