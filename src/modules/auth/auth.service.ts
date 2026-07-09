import { randomBytes } from 'node:crypto';

import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';

import { validateHash } from '../../common/utils.ts';
import { AccountStatus } from '../../constants/account-status.ts';
import { LogLevel } from '../../constants/log-level.ts';
import { LogSource } from '../../constants/log-source.ts';
import { RoleType } from '../../constants/role-type.ts';
import { TokenType } from '../../constants/token-type.ts';
import { AccountDisabledException } from '../../exceptions/account-disabled.exception.ts';
import { InvalidCredentialsException } from '../../exceptions/invalid-credentials.exception.ts';
import { UserNotFoundException } from '../../exceptions/user-not-found.exception.ts';
import { ApiConfigService } from '../../shared/services/api-config.service.ts';
import { AdminLogsService } from '../admin-logs/admin-logs.service.ts';
import type { UserEntity } from '../user/user.entity.ts';
import { UserService } from '../user/user.service.ts';
import { LoginPayloadDto } from './dto/login-payload.dto.ts';
import type { RegisterDto } from './dto/register.dto.ts';
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

  async register(dto: RegisterDto): Promise<LoginPayloadDto> {
    const result = await this.userService.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: dto.password,
      role: RoleType.CREATOR,
      status: AccountStatus.ACTIVE,
    });

    const accessToken = await this.createAccessToken({
      userId: result.id as Uuid,
      role: RoleType.CREATOR,
    });

    return LoginPayloadDto.create({ accessToken });
  }

  async googleLogin(idToken: string): Promise<LoginPayloadDto> {
    const clientId = this.configService.googleClientId;

    if (!clientId) {
      throw new BadRequestException('Google OAuth is not configured');
    }

    const client = new OAuth2Client(clientId);
    let email: string;
    let firstName: string;
    let lastName: string;

    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: clientId,
      });
      const payload = ticket.getPayload();

      if (!payload?.email) {
        throw new Error('No email in token');
      }

      email = payload.email;
      firstName = payload.given_name ?? 'User';
      lastName = payload.family_name ?? '';
    } catch {
      throw new UnauthorizedException('error.invalidGoogleToken');
    }

    let user = await this.userService.findOne({ email });

    if (!user) {
      await this.userService.create({
        firstName,
        lastName,
        email,
        password: randomBytes(32).toString('hex'),
        role: RoleType.CREATOR,
        status: AccountStatus.ACTIVE,
      });
      user = await this.userService.findOne({ email });
    }

    if (!user) {
      throw new UserNotFoundException();
    }

    if (user.status === AccountStatus.DISABLED) {
      throw new AccountDisabledException();
    }

    const accessToken = await this.createAccessToken({
      userId: user.id,
      role: user.role,
    });

    return LoginPayloadDto.create({ accessToken });
  }

  async promoteToAdmin(email: string): Promise<void> {
    const user = await this.userService.findOne({ email });

    if (!user) {
      throw new UserNotFoundException();
    }

    await this.userService.updateUserRole(user.id, RoleType.ADMIN);
  }

  private recordLoginFailure(email: string, reason: string): void {
    /*
     * The email is attacker-controllable on the unauthenticated login path, so
     * we log it for audit value (which account was targeted) but truncate to a
     * sane bound to keep a flood of junk attempts from bloating the audit table.
     *
     * NOTE: login rate-limiting is NOT yet enforced — ThrottlerModule is
     * configured (app.module.ts) but no global `APP_GUARD: ThrottlerGuard` is
     * registered, so /auth/login is currently unthrottled. Wiring the global
     * throttler guard is a separate, app-wide follow-up.
     */
    const MAX_EMAIL_LEN = 320; // RFC 5321 max address length.
    this.adminLogsService.record({
      level: LogLevel.WARN,
      source: LogSource.AUTH,
      message: `Login failed: ${reason}`,
      context: { email: email.slice(0, MAX_EMAIL_LEN) },
    });
  }
}
