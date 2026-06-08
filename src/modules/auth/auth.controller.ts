import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { RoleType } from '../../constants/role-type.ts';
import { AuthUser } from '../../decorators/auth-user.decorator.ts';
import { Auth } from '../../decorators/http.decorators.ts';
import type { UserEntity } from '../user/user.entity.ts';
import { AuthService } from './auth.service.ts';
import { GetMeDto } from './dto/get-me.dto.ts';
import { LoginPayloadDto } from './dto/login-payload.dto.ts';
import { UserLoginDto } from './dto/user-login.dto.ts';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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

    const accessToken = await this.authService.createAccessToken({
      userId: userEntity.id,
      role: userEntity.role,
    });

    return LoginPayloadDto.create({ accessToken });
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @Auth([RoleType.CREATOR, RoleType.ADMIN])
  @ApiOkResponse({ description: 'current user info' })
  getCurrentUser(@AuthUser() user: UserEntity): GetMeDto {
    const { id, firstName, lastName, email, role, avatar } = user;

    return GetMeDto.create({
      id,
      firstName,
      lastName,
      email,
      role,
      avatar,
    });
  }
}
