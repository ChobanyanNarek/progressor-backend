import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { DataSource } from 'typeorm';
import {
  addTransactionalDataSource,
  getDataSourceByName,
} from 'typeorm-transactional';

import { AdminDashboardModule } from './modules/admin-dashboard/admin-dashboard.module.ts';
import { AdminLogsModule } from './modules/admin-logs/admin-logs.module.ts';
import { AdminMediaModule } from './modules/admin-media/admin-media.module.ts';
import { AuthModule } from './modules/auth/auth.module.ts';
import { HealthCheckerModule } from './modules/health-checker/health-checker.module.ts';
import { MemoryPointAiGenerationModule } from './modules/memory-point-ai-generation/memory-point-ai-generation.module.ts';
import { MemoryPointModule } from './modules/memory-points/memory-point.module.ts';
import { UserModule } from './modules/user/user.module.ts';
import { ApiConfigService } from './shared/services/api-config.service.ts';
import { SharedModule } from './shared/shared.module.ts';

@Module({
  imports: [
    AuthModule,
    UserModule,
    MemoryPointModule,
    MemoryPointAiGenerationModule,
    AdminDashboardModule,
    AdminLogsModule,
    AdminMediaModule,
    ScheduleModule.forRoot(),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [SharedModule],
      useFactory: (configService: ApiConfigService) => ({
        throttlers: [configService.throttlerConfigs],
      }),
      inject: [ApiConfigService],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [SharedModule],
      useFactory: (configService: ApiConfigService) =>
        configService.postgresConfig,
      inject: [ApiConfigService],
      dataSourceFactory: (options) => {
        if (!options) {
          throw new Error('Invalid options passed');
        }

        // Reuse existing DataSource on Vite HMR hot reload
        const existingDs = getDataSourceByName('default');
        if (existingDs) {
          return Promise.resolve(existingDs);
        }

        return Promise.resolve(
          addTransactionalDataSource(new DataSource(options)),
        );
      },
    }),
    // eslint-disable-next-line canonical/id-match
    I18nModule.forRootAsync({
      useFactory: (configService: ApiConfigService) => ({
        fallbackLanguage: configService.fallbackLanguage,
        loaderOptions: {
          path: path.join(
            // import.meta.dirname is undefined under jest's ESM runtime.
            // eslint-disable-next-line unicorn/prefer-import-meta-properties
            path.dirname(fileURLToPath(import.meta.url)),
            'i18n/',
          ),
          watch: configService.isDevelopment,
        },
      }),
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-lang']),
      ],
      imports: [SharedModule],
      inject: [ApiConfigService],
    }),
    HealthCheckerModule,
  ],
  providers: [],
})
export class AppModule {}
