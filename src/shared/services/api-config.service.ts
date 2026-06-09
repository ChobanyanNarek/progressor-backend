import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ThrottlerOptions } from '@nestjs/throttler';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import parse from 'parse-duration';

import type {
  IAppConfig,
  IAuthConfig,
  IDidConfig,
  IGcpConfig,
} from '../../common/interfaces';
import { UserSubscriber } from '../../entity-subscribers/user-subscriber.ts';
import { SnakeNamingStrategy } from '../../snake-naming.strategy.ts';

@Injectable()
export class ApiConfigService {
  constructor(private configService: ConfigService) {}

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }

  private getNumber(key: string): number {
    const value = this.get(key);
    const num = Number(value);

    if (Number.isNaN(num)) {
      throw new TypeError(
        `Environment variable ${key} must be a number. Received: ${value}`,
      );
    }

    return num;
  }

  private getDuration(
    key: string,
    format?: Parameters<typeof parse>[1],
  ): number {
    const value = this.getString(key);
    const duration = parse(value, format);

    if (duration === null) {
      throw new Error(
        `Environment variable ${key} must be a valid duration. Received: ${value}`,
      );
    }

    return duration;
  }

  private getBoolean(key: string): boolean {
    const value = this.get(key);

    try {
      return Boolean(JSON.parse(value));
    } catch {
      throw new Error(
        `Environment variable ${key} must be a boolean. Received: ${value}`,
      );
    }
  }

  private getString(key: string, defaultValue?: string): string {
    const value = this.configService.get<string>(key);

    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }

      throw new Error(`${key} environment variable doesn't exist`);
    }

    return value.replaceAll(String.raw`\n`, '\n');
  }

  get nodeEnv(): string {
    return this.getString('NODE_ENV');
  }

  get fallbackLanguage(): string {
    return this.getString('FALLBACK_LANGUAGE');
  }

  /**
   * Maximum age (in milliseconds) a PENDING memory point may keep before its
   * details are submitted. Older detail-less drafts are purged by the cleanup
   * cron. Configured as a human duration (e.g. `24h`); parsed to ms.
   */
  get memoryPointDraftTtl(): number {
    return this.getDuration('MEMORY_POINT_DRAFT_TTL');
  }

  /**
   * Radius (in metres) used to detect duplicate memory points at creation time.
   * When a new point would land within this distance of an existing point, the
   * create handler rejects it with a 409 unless `force: true` is supplied.
   * Configure via DUPLICATE_RADIUS_METERS in the environment.
   */
  get duplicateRadiusMeters(): number {
    return this.getNumber('DUPLICATE_RADIUS_METERS');
  }

  get throttlerConfigs(): ThrottlerOptions {
    return {
      ttl: this.getDuration('THROTTLER_TTL', 'second'),
      limit: this.getNumber('THROTTLER_LIMIT'),
      // storage: new ThrottlerStorageRedisService(new Redis(this.redis)),
    };
  }

  get postgresConfig(): TypeOrmModuleOptions {
    /*
     * Derive the module directory from its URL rather than `import.meta.dirname`
     * (cleaner, but undefined under jest's ESM runtime). `import.meta.url` is
     * populated everywhere: Node, Vite, Bun and jest.
     */
    // eslint-disable-next-line unicorn/prefer-import-meta-properties
    const dirname = path.dirname(fileURLToPath(import.meta.url));
    const entities = [
      path.join(dirname, `../../modules/**/*.entity{.ts,.js}`),
      path.join(dirname, `../../modules/**/*.view-entity{.ts,.js}`),
    ];
    const migrations = [
      path.join(dirname, `../../database/migrations/*{.ts,.js}`),
    ];

    return {
      entities,
      migrations,
      dropSchema: this.isTest,
      type: 'postgres',
      host: this.getString('DB_HOST'),
      port: this.getNumber('DB_PORT'),
      username: this.getString('DB_USERNAME'),
      password: this.getString('DB_PASSWORD'),
      database: this.getString('DB_DATABASE'),
      subscribers: [UserSubscriber],
      migrationsRun: true,
      logging: this.getBoolean('ENABLE_ORM_LOGS'),
      namingStrategy: new SnakeNamingStrategy(),
    };
  }

  get documentationEnabled(): boolean {
    return this.getBoolean('ENABLE_DOCUMENTATION');
  }

  get authConfig(): IAuthConfig {
    return {
      privateKey: this.getString('JWT_PRIVATE_KEY'),
      publicKey: this.getString('JWT_PUBLIC_KEY'),
      jwtExpirationTime: this.getNumber('JWT_EXPIRATION_TIME'),
    };
  }

  get appConfig(): IAppConfig {
    return {
      port: this.getString('PORT'),
    };
  }

  get didConfig(): IDidConfig {
    return {
      apiKey: this.getString('DID_API_KEY'),
      baseUrl: this.getString('DID_BASE_URL', 'https://api.d-id.com'),
      webhookUrl: this.getString('DID_WEBHOOK_URL'),
      webhookSecret: this.getString('DID_WEBHOOK_SECRET'),
    };
  }

  get gcpConfig(): IGcpConfig {
    return {
      projectId: this.getString('GCP_PROJECT_ID'),
      bucket: this.getString('GCS_BUCKET_NAME'),
      location: this.getString('CLOUD_TASKS_LOCATION'),
      queue: this.getString('CLOUD_TASKS_QUEUE'),
      targetUrl: this.getString('CLOUD_TASKS_TARGET_URL'),
      invokerServiceAccount: this.getString('CLOUD_TASKS_INVOKER_SA'),
      maxUploadBytes: this.getNumber('GCS_MAX_UPLOAD_BYTES'),
    };
  }

  private get(key: string): string {
    const value = this.configService.get<string>(key);

    if (value == null) {
      throw new Error(`Environment variable ${key} is not set`);
    }

    return value;
  }
}
