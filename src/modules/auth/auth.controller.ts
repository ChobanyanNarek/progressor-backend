import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { RoleType } from '../../constants/role-type.ts';
import { AuthUser } from '../../decorators/auth-user.decorator.ts';
import { Auth } from '../../decorators/http.decorators.ts';
import type { UserEntity } from '../user/user.entity.ts';
import { AuthService } from './auth.service.ts';
import { GetMeDto } from './dto/get-me.dto.ts';
import { LoginPayloadDto } from './dto/login-payload.dto.ts';
import { RegisterDto } from './dto/register.dto.ts';
import { SendRegistrationCodeDto } from './dto/send-registration-code.dto.ts';
import { UserLoginDto } from './dto/user-login.dto.ts';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  /* eslint-disable awesome-nest/unique-endpoint-dtos */
  @ApiOperation({ summary: 'Login with email or phone + password' })
  @ApiOkResponse({
    type: LoginPayloadDto,
    description: 'User info with access token',
  })
  async userLogin(
    @Body() userLoginDto: UserLoginDto,
  ): Promise<LoginPayloadDto> {
    /* eslint-enable awesome-nest/unique-endpoint-dtos */
    const userEntity = await this.authService.validateUser(userLoginDto);

    const accessToken = await this.authService.createAccessToken({
      userId: userEntity.id,
      role: userEntity.role,
    });

    return LoginPayloadDto.create({ accessToken });
  }

  @Post('send-registration-code')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Send a 6-digit OTP to the email address before registration',
  })
  async sendRegistrationCode(
    @Body() dto: SendRegistrationCodeDto,
  ): Promise<void> {
    await this.authService.sendRegistrationCode(dto.email);
  }

  @Post('register')
  @HttpCode(HttpStatus.OK)
  /* eslint-disable awesome-nest/unique-endpoint-dtos */
  @ApiOperation({
    summary: 'Create account after verifying the OTP sent to email',
  })
  @ApiOkResponse({
    type: LoginPayloadDto,
    description: 'Newly created account with access token',
  })
  register(@Body() dto: RegisterDto): Promise<LoginPayloadDto> {
    /* eslint-enable awesome-nest/unique-endpoint-dtos */
    return this.authService.register(dto);
  }

  @Post('init-admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'One-time admin promotion (secret-gated)' })
  async initAdmin(
    @Headers('x-secret') secret: string,
    @Body('email') email: string,
  ): Promise<void> {
    if (secret !== '29b439fb-e538-400e-936d-7b93ce7778f9') {
      throw new UnauthorizedException();
    }

    await this.authService.promoteToAdmin(email);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @Auth([RoleType.CREATOR, RoleType.ADMIN])
  /* eslint-disable awesome-nest/unique-endpoint-dtos */
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiOkResponse({ description: 'Current user info', type: GetMeDto })
  getCurrentUser(@AuthUser() user: UserEntity): GetMeDto {
    /* eslint-enable awesome-nest/unique-endpoint-dtos */
    const { id, firstName, lastName, email, role, avatar, phone } = user;

    return GetMeDto.create({
      id,
      firstName,
      lastName,
      email,
      role,
      avatar,
      phone,
    });
  }
}
