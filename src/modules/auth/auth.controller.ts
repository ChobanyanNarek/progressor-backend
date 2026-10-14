import { timingSafeEqual } from 'node:crypto';

import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

import { RoleType } from '../../constants/role-type.ts';
import { AuthUser } from '../../decorators/auth-user.decorator.ts';
import { Auth } from '../../decorators/http.decorators.ts';
import { ApiConfigService } from '../../shared/services/api-config.service.ts';
import type { UserEntity } from '../user/user.entity.ts';
import { AuthService } from './auth.service.ts';
import { GetMeDto } from './dto/get-me.dto.ts';

class SendRegistrationCodeDto {
  @IsEmail()
  email!: string;
}
import { GoogleTokenDto } from './dto/google-token.dto.ts';
import { LoginPayloadDto } from './dto/login-payload.dto.ts';
import { RefreshPayloadDto, RefreshTokenDto } from './dto/refresh-token.dto.ts';
import { RegisterDto } from './dto/register.dto.ts';
import { UserLoginDto } from './dto/user-login.dto.ts';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ApiConfigService,
  ) {}

  /*
   * These routes hand out super admin with no session behind them, so the gate is the
   * only thing between the open internet and the account list. The secret lives in the
   * environment now, and an unset one shuts the route rather than falling back to
   * anything: a missing variable must never mean "let everyone in". Compared in constant
   * time, and reported as 404 so an attacker cannot even learn the route is there.
   */
  private assertBootstrapSecret(given: string | undefined): void {
    const expected = this.configService.bootstrapSecret;

    if (!expected) {
      throw new NotFoundException();
    }

    const a = Buffer.from(given ?? '');
    const b = Buffer.from(expected);

    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException();
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    // eslint-disable-next-line awesome-nest/unique-endpoint-dtos
    type: LoginPayloadDto,
    description: 'User info with access token',
  })
  async userLogin(
    @Body() userLoginDto: UserLoginDto,
  ): Promise<LoginPayloadDto> {
    const userEntity = await this.authService.validateUser(userLoginDto);

    const [accessToken, refreshToken] = await Promise.all([
      this.authService.createAccessToken({
        userId: userEntity.id,
        role: userEntity.role,
      }),
      this.authService.createRefreshToken({ userId: userEntity.id }),
    ]);

    return LoginPayloadDto.create({ accessToken, refreshToken });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exchange a refresh token for a fresh access token',
  })
  @ApiOkResponse({
    // eslint-disable-next-line awesome-nest/unique-endpoint-dtos
    type: RefreshPayloadDto,
    description: 'New access token and a rotated refresh token',
  })
  async refresh(@Body() dto: RefreshTokenDto): Promise<RefreshPayloadDto> {
    const { accessToken, refreshToken } = await this.authService.refreshTokens(
      dto.refreshToken,
    );

    return RefreshPayloadDto.create({ accessToken, refreshToken });
  }

  @Post('send-registration-code')
  @HttpCode(HttpStatus.NO_CONTENT)
  sendRegistrationCode(@Body() dto: SendRegistrationCodeDto): Promise<void> {
    return this.authService.sendRegistrationCode(dto.email);
  }

  @Post('register')
  @HttpCode(HttpStatus.OK)
  /* eslint-disable awesome-nest/unique-endpoint-dtos */
  @ApiOkResponse({
    type: LoginPayloadDto,
    description: 'Newly created account with access token',
  })
  register(@Body() dto: RegisterDto): Promise<LoginPayloadDto> {
    /* eslint-enable awesome-nest/unique-endpoint-dtos */
    return this.authService.register(dto);
  }

  @Post('google-token')
  @HttpCode(HttpStatus.OK)
  /* eslint-disable awesome-nest/unique-endpoint-dtos */
  @ApiOkResponse({
    type: LoginPayloadDto,
    description: 'Sign in or register via Google ID token',
  })
  googleToken(@Body() dto: GoogleTokenDto): Promise<LoginPayloadDto> {
    /* eslint-enable awesome-nest/unique-endpoint-dtos */
    return this.authService.googleLogin(dto.idToken);
  }

  @Post('init-admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async initAdmin(
    @Headers('x-secret') secret: string,
    @Body('email') email: string,
  ): Promise<void> {
    this.assertBootstrapSecret(secret);

    await this.authService.promoteToAdmin(email);
  }

  @Post('init-super-admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async initSuperAdmin(
    @Headers('x-secret') secret: string,
    @Body('email') email: string,
  ): Promise<void> {
    this.assertBootstrapSecret(secret);

    await this.authService.promoteToSuperAdmin(email);
  }

  @Post('init-create-super-admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async initCreateSuperAdmin(
    @Headers('x-secret') secret: string,
    @Body('phone') phone: string,
    @Body('password') password: string,
  ): Promise<void> {
    this.assertBootstrapSecret(secret);

    await this.authService.createSuperAdminAccount(phone, password);
  }

  @Post('init-demote-to-creator')
  @HttpCode(HttpStatus.NO_CONTENT)
  async initDemoteToCreator(
    @Headers('x-secret') secret: string,
    @Body('email') email: string,
  ): Promise<void> {
    this.assertBootstrapSecret(secret);

    await this.authService.demoteToCreator(email);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @Auth([RoleType.CREATOR, RoleType.ADMIN, RoleType.SUPER_ADMIN])
  @ApiOkResponse({
    description: 'current user info',
    // eslint-disable-next-line awesome-nest/unique-endpoint-dtos
    type: GetMeDto,
  })
  getCurrentUser(@AuthUser() user: UserEntity): GetMeDto {
    return GetMeDto.create({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      subscriptionActive: user.subscriptionActive,
      subscriptionUntil: user.subscriptionUntil,
      trialUntil: user.trialUntil,
    });
  }
}
