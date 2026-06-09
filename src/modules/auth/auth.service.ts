import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { validateHash } from '../../common/utils.ts';
import { AccountStatus } from '../../constants/account-status.ts';
import { LogLevel } from '../../constants/log-level.ts';
import { LogSource } from '../../constants/log-source.ts';
import type { RoleType } from '../../constants/role-type.ts';
import { TokenType } from '../../constants/token-type.ts';
import { AccountDisabledException } from '../../exceptions/account-disabled.exception.ts';
import { InvalidCredentialsException } from '../../exceptions/invalid-credentials.exception.ts';
import { UserNotFoundException } from '../../exceptions/user-not-found.exception.ts';
import { ApiConfigService } from '../../shared/services/api-config.service.ts';
import { AdminLogsService } from '../admin-logs/admin-logs.service.ts';
import type { UserEntity } from '../user/user.entity.ts';
import { UserService } from '../user/user.service.ts';
import { TokenPayloadDto } from './dto/token-payload.dto.ts';
import type { UserLoginDto } from './dto/user-login.dto.ts';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ApiConfigService,
    private userService: UserService,
    private adminLogsService: AdminLogsService,
  ) {}

  async createAccessToken(data: {
    role: RoleType;
    userId: Uuid;
  }): Promise<TokenPayloadDto> {
    return TokenPayloadDto.create({
      expiresIn: this.configService.authConfig.jwtExpirationTime,
      token: await this.jwtService.signAsync(
        {
          userId: data.userId,
          type: TokenType.ACCESS_TOKEN,
          role: data.role,
        },
        // Embed a standard `exp` claim so clients can pre-empt expiry.
        { expiresIn: this.configService.authConfig.jwtExpirationTime },
      ),
    });
  }

  async validateUser(userLoginDto: UserLoginDto): Promise<UserEntity> {
    const user = await this.userService.findOne({
      email: userLoginDto.email,
    });

    /*
     * Unknown account → 404; wrong password for a real account → 401. Keeping
     * these distinct lets the client show an accurate message.
     */
    if (!user) {
      this.recordLoginFailure(userLoginDto.email, 'userNotFound');

      throw new UserNotFoundException();
    }

    const isPasswordValid = await validateHash(
      userLoginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      this.recordLoginFailure(userLoginDto.email, 'invalidCredentials');

      throw new InvalidCredentialsException();
    }

    /*
     * Enforce account deactivation at login (PRD 6.2/8.5.3). A DISABLED account
     * must not obtain a token even with the correct password.
     */
    if (user.status === AccountStatus.DISABLED) {
      this.recordLoginFailure(userLoginDto.email, 'accountDisabled');

      throw new AccountDisabledException();
    }

    await this.userService.update(user.id, { lastLogin: new Date() });

    this.adminLogsService.record({
      level: LogLevel.INFO,
      source: LogSource.AUTH,
      message: 'Login succeeded',
      context: { userId: user.id, role: user.role },
    });

    return user;
  }

  private recordLoginFailure(email: string, reason: string): void {
    this.adminLogsService.record({
      level: LogLevel.WARN,
      source: LogSource.AUTH,
      message: `Login failed: ${reason}`,
      context: { email },
    });
  }
}
