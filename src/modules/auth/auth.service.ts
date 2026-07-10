import { randomInt } from 'node:crypto';

import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

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
import { ResendService } from '../../shared/services/resend.service.ts';
import { AdminLogsService } from '../admin-logs/admin-logs.service.ts';
import type { UserEntity } from '../user/user.entity.ts';
import { UserService } from '../user/user.service.ts';
import { LoginPayloadDto } from './dto/login-payload.dto.ts';
import type { RegisterDto } from './dto/register.dto.ts';
import { TokenPayloadDto } from './dto/token-payload.dto.ts';
import type { UserLoginDto } from './dto/user-login.dto.ts';
import { EmailVerificationEntity } from './email-verification.entity.ts';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ApiConfigService,
    private userService: UserService,
    private adminLogsService: AdminLogsService,
    private resendService: ResendService,
    @InjectRepository(EmailVerificationEntity)
    private emailVerRepo: Repository<EmailVerificationEntity>,
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
        { expiresIn: this.configService.authConfig.jwtExpirationTime },
      ),
    });
  }

  async validateUser(userLoginDto: UserLoginDto): Promise<UserEntity> {
    const credential = userLoginDto.credential.trim();
    const isEmail = credential.includes('@');
    const user = isEmail
      ? await this.userService.findOne({ email: credential })
      : await this.userService.findOne({ phone: credential });

    if (!user) {
      this.recordLoginFailure(credential, 'userNotFound');

      throw new UserNotFoundException();
    }

    const isPasswordValid = await validateHash(
      userLoginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      this.recordLoginFailure(credential, 'invalidCredentials');

      throw new InvalidCredentialsException();
    }

    if (user.status === AccountStatus.DISABLED) {
      this.recordLoginFailure(credential, 'accountDisabled');

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

  async sendRegistrationCode(email: string): Promise<void> {
    const existing = await this.userService.findOne({ email });

    if (existing) {
      throw new BadRequestException('error.userExists');
    }

    const code = String(randomInt(100_000, 1_000_000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.emailVerRepo
      .createQueryBuilder()
      .delete()
      .where('email = :email', { email })
      .execute();

    await this.emailVerRepo
      .createQueryBuilder()
      .insert()
      .values({ email, code, expiresAt })
      .execute();

    await this.resendService.sendRegistrationCode(email, code);
  }

  async register(dto: RegisterDto): Promise<LoginPayloadDto> {
    const verification = await this.emailVerRepo
      .createQueryBuilder('ev')
      .where('ev.email = :email', { email: dto.email })
      .getOne();

    if (!verification || verification.code !== dto.code) {
      throw new UnauthorizedException('error.invalidVerificationCode');
    }

    if (verification.expiresAt < new Date()) {
      throw new UnauthorizedException('error.verificationCodeExpired');
    }

    await this.emailVerRepo
      .createQueryBuilder()
      .delete()
      .where('email = :email', { email: dto.email })
      .execute();

    const result = await this.userService.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
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

  async promoteToAdmin(email: string): Promise<void> {
    const user = await this.userService.findOne({ email });

    if (!user) {
      throw new UserNotFoundException();
    }

    await this.userService.updateUserRole(user.id, RoleType.ADMIN);
  }

  private recordLoginFailure(credential: string, reason: string): void {
    const MAX_LEN = 320;
    this.adminLogsService.record({
      level: LogLevel.WARN,
      source: LogSource.AUTH,
      message: `Login failed: ${reason}`,
      context: { credential: credential.slice(0, MAX_LEN) },
    });
  }
}
