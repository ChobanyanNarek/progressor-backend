import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { initializeTransactionalContext } from 'typeorm-transactional';

import { AppModule } from '../src/app.module.ts';

/**
 * Boots the full application against the isolated `e2e_test` database and hits
 * the health endpoint, which pings the database. This smoke test proves the
 * app wires up end-to-end (modules, providers, DB connection) and serves as the
 * baseline for further e2e specs.
 */
describe('HealthCheckerController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    /*
     * main.ts does this at bootstrap; the e2e boots AppModule directly, so the
     * transactional context must be initialized before the DataSource starts.
     */
    initializeTransactionalContext();

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns 200 with an ok status and a healthy database', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('ok');
    expect(response.body.info?.database?.status).toBe('up');
  });
});
