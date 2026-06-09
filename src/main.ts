import './boilerplate.polyfill';

import {
  ClassSerializerInterceptor,
  HttpStatus,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ExpressAdapter } from '@nestjs/platform-express';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import { initializeTransactionalContext } from 'typeorm-transactional';

import { AppModule } from './app.module.ts';
import { parseCorsOrigins } from './common/utils.ts';
import { HttpExceptionFilter } from './filters/bad-request.filter.ts';
import { QueryFailedFilter } from './filters/query-failed.filter.ts';
import { TranslationInterceptor } from './interceptors/translation-interceptor.service.ts';
import { loadSecrets } from './load-secrets.ts';
import { AdminLogsService } from './modules/admin-logs/admin-logs.service.ts';
import { setupSwagger } from './setup-swagger.ts';
import { ApiConfigService } from './shared/services/api-config.service.ts';
import { TranslationService } from './shared/services/translation.service.ts';
import { SharedModule } from './shared/shared.module.ts';

export async function bootstrap(): Promise<NestExpressApplication> {
  /*
   * Load runtime config from Secret Manager BEFORE the app module is created,
   * so ConfigModule/ApiConfigService read the merged process.env.
   */
  if (process.env.NODE_ENV === 'production') {
    await loadSecrets();
  }

  initializeTransactionalContext();
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(),
    {
      cors: {
        origin: parseCorsOrigins(process.env.CORS_ORIGINS),
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        credentials: true,
      },
    },
  );
  app.enable('trust proxy');
  app.use(helmet());
  // app.setGlobalPrefix('/api'); use api as global prefix if you don't have subdomain
  app.use(compression());
  app.use(morgan('combined'));
  app.enableVersioning();

  const reflector = app.get(Reflector);

  app.useGlobalFilters(
    new HttpExceptionFilter(reflector),
    new QueryFailedFilter(reflector, app.get(AdminLogsService)),
  );

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector),
    new TranslationInterceptor(
      app.select(SharedModule).get(TranslationService),
    ),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      transform: true,
      dismissDefaultMessages: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => new UnprocessableEntityException(errors),
    }),
  );

  const configService = app.select(SharedModule).get(ApiConfigService);

  if (configService.documentationEnabled) {
    setupSwagger(app);
  }

  // Starts listening for shutdown hooks
  if (!configService.isDevelopment) {
    app.enableShutdownHooks();
  }

  const port = configService.appConfig.port;

  /*
   * Vite plugin binds the server in dev mode (PROD===false); in all other runtimes import.meta.env is undefined.
   * biome-ignore lint/style/useNamingConvention: PROD is Vite's injected env key
   */
  const viteEnv = (
    import.meta as unknown as { env?: { DEV?: boolean; PROD?: boolean } }
  ).env;

  if (!viteEnv?.DEV) {
    await app.listen(port, '0.0.0.0');
    console.info(`server running on http://localhost:${port}`);
  }

  return app;
}

export const viteNodeApp = await bootstrap();
