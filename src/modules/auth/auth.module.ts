import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApiConfigService } from '../../shared/services/api-config.service.ts';
import { ResendService } from '../../shared/services/resend.service.ts';
import { AdminLogsModule } from '../admin-logs/admin-logs.module.ts';
import { UserModule } from '../user/user.module.ts';
import { AuthController } from './auth.controller.ts';
import { AuthService } from './auth.service.ts';
import { EmailVerificationEntity } from './email-verification.entity.ts';
import { JwtStrategy } from './jwt.strategy.ts';
import { PublicStrategy } from './public.strategy.ts';

@Module({
  imports: [
    forwardRef(() => UserModule),
    AdminLogsModule,
    TypeOrmModule.forFeature([EmailVerificationEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: (configService: ApiConfigService) => ({
        privateKey: configService.authConfig.privateKey,
        publicKey: configService.authConfig.publicKey,
        signOptions: { algorithm: 'RS256' },
        verifyOptions: { algorithms: ['RS256'] },
      }),
      inject: [ApiConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PublicStrategy, ResendService],
  exports: [JwtModule, AuthService],
})
export class AuthModule {}
