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
import express from 'express';
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
  const isProduction = process.env.NODE_ENV === 'production';
  const appPort = Number(process.env.PORT ?? 3000);

  const expressInstance = express();
  expressInstance.disable('x-powered-by');
  expressInstance.use(express.json({ limit: '10mb' }));
  expressInstance.use(express.urlencoded({ limit: '10mb', extended: true }));

  /*
   * On Render Starter (512 MB RAM), NestJS cold start takes 40-90 s which
   * exceeds Render's 30 s health-check window.  Bind the production port
   * immediately and register /health so Render's rolling-deploy health checks
   * pass during bootstrap.  NestJS registers its own routes onto the same
   * expressInstance later, so app.init() (not app.listen()) is used to avoid
   * a duplicate port bind.
   */
  if (isProduction) {
    expressInstance.get('/health', (_req, res) => {
      res.status(200).json({ status: 'ok' });
    });

    await new Promise<void>((resolve, reject) => {
      const srv = expressInstance.listen(appPort, '0.0.0.0', () => {
        console.info(`[boot] health endpoint ready on :${appPort}`);
        resolve();
      });
      srv.on('error', reject);
    });
  }

  if (isProduction) {
    await loadSecrets();
  }

  initializeTransactionalContext();

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(expressInstance),
    {
      bodyParser: false,
      cors: {
        origin: parseCorsOrigins(process.env.CORS_ORIGINS),
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        credentials: true,
      },
    },
  );
  app.enable('trust proxy');
  app.use(helmet());
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

  if (!configService.isDevelopment) {
    app.enableShutdownHooks();
  }

  interface IViteImportMeta {
    // biome-ignore lint/style/useNamingConvention: PROD/DEV are Vite's injected env keys
    env?: { DEV?: boolean; PROD?: boolean };
  }
  const viteEnv = (import.meta as unknown as IViteImportMeta).env;

  if (!viteEnv?.DEV) {
    if (isProduction) {
      // Port already bound above; just initialize NestJS without re-listening.
      await app.init();
      console.info(`server fully initialized on http://localhost:${appPort}`);
    } else {
      await app.listen(appPort, '0.0.0.0');
      console.info(`server running on http://localhost:${appPort}`);
    }
  }

  return app;
}

export const viteNodeApp = await bootstrap();
