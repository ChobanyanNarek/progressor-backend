import '../src/boilerplate.polyfill.ts';

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import {
  ClassSerializerInterceptor,
  HttpStatus,
  type INestApplication,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { initializeTransactionalContext } from 'typeorm-transactional';

import { AppModule } from '../src/app.module.ts';
import { RoleType } from '../src/constants/role-type.ts';
import { UserEntity } from '../src/modules/user/user.entity.ts';
import { GcsStorageService } from '../src/shared/services/gcs-storage.service.ts';

const CREATOR = { email: 'creator-e2e@test.com', password: 'password123' };
const ADMIN = { email: 'admin-e2e@test.com', password: 'password123' };

const authHeader = (token: string): { Authorization: string } => ({
  Authorization: `Bearer ${token}`,
});

/**
 * End-to-end coverage for the memory point creation flow against the isolated
 * `e2e_test` database. The GCS boundary is stubbed (no real bucket in tests):
 * upload URLs are issued and the source files are treated as present, so the
 * flow can exercise create -> upload-url -> details -> admin review.
 */
describe('Memory points (e2e)', () => {
  let app: INestApplication;
  let creatorToken: string;
  let adminToken: string;

  const login = async (credentials: {
    email: string;
    password: string;
  }): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(credentials)
      .expect(200);

    return response.body.accessToken.token;
  };

  beforeAll(async () => {
    /*
     * main.ts does this at bootstrap; the e2e boots AppModule directly, so the
     * transactional context must be initialized before the DataSource starts.
     */
    initializeTransactionalContext();

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(GcsStorageService)
      .useValue({
        getSignedWriteUrl: () => Promise.resolve('https://example.test/upload'),
        exists: () => Promise.resolve(true),
        deletePrefix: () => Promise.resolve(),
      })
      .compile();

    app = moduleFixture.createNestApplication();

    // Mirror the request-pipeline globals from main.ts that affect these routes.
    const reflector = app.get(Reflector);
    app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));
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
    await app.init();

    // Seed a creator and an admin; the user subscriber hashes the password.
    const userRepository = app.get(DataSource).getRepository(UserEntity);
    await userRepository.save(
      userRepository.create({
        firstName: 'Test',
        lastName: 'Creator',
        email: CREATOR.email,
        password: CREATOR.password,
        role: RoleType.CREATOR,
      }),
    );
    await userRepository.save(
      userRepository.create({
        firstName: 'Test',
        lastName: 'Admin',
        email: ADMIN.email,
        password: ADMIN.password,
        role: RoleType.ADMIN,
      }),
    );

    creatorToken = await login(CREATOR);
    adminToken = await login(ADMIN);
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

  describe('creator completes a point, admin sees it; drafts stay hidden', () => {
    let completedPointId: string;
    let draftPointId: string;

    it('creates a point in PENDING state', async () => {
      const response = await request(app.getHttpServer())
        .post('/creator/memory-points')
        .set(authHeader(creatorToken))
        .send({ latitude: 40.1, longitude: 44.5 })
        .expect(201);

      expect(response.body.status).toBe('PENDING');
      completedPointId = response.body.id;
    });

    it('creates a second point left as an incomplete draft', async () => {
      const response = await request(app.getHttpServer())
        .post('/creator/memory-points')
        .set(authHeader(creatorToken))
        .send({ latitude: 41, longitude: 45 })
        .expect(201);

      draftPointId = response.body.id;
    });

    it('submitting details moves the point to ADMIN_REVIEWING', async () => {
      const uploadUrlResponse = await request(app.getHttpServer())
        .post(`/creator/memory-points/${completedPointId}/upload-url`)
        .set(authHeader(creatorToken))
        .send({ photoContentType: 'jpg', audioContentType: 'mp3' })
        .expect(201);
      const urls = uploadUrlResponse.body;

      await request(app.getHttpServer())
        .post(`/creator/memory-points/${completedPointId}/details`)
        .set(authHeader(creatorToken))
        .send({
          sourcePhotoUrl: urls.photo.objectPath,
          sourceAudioUrl: urls.audio.objectPath,
          title: 'E2E memory',
          description: 'Created by the e2e flow',
          cloudAnchorId: 'anchor-e2e',
          type: 'MEMORIAL',
        })
        .expect(200);
    });

    it('shows the completed point (ADMIN_REVIEWING) but not the draft in "mine"', async () => {
      const response = await request(app.getHttpServer())
        .get('/creator/memory-points/mine?page=1&take=50')
        .set(authHeader(creatorToken))
        .expect(200);

      const ids = response.body.data.map((point: { id: string }) => point.id);
      expect(ids).toContain(completedPointId);
      expect(ids).not.toContain(draftPointId);

      const completed = response.body.data.find(
        (point: { id: string }) => point.id === completedPointId,
      );
      expect(completed.status).toBe('ADMIN_REVIEWING');
    });

    it('shows the completed point in the admin list and excludes PENDING drafts', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/memory-points?page=1&take=50')
        .set(authHeader(adminToken))
        .expect(200);

      const ids = response.body.data.map((point: { id: string }) => point.id);
      expect(ids).toContain(completedPointId);
      expect(ids).not.toContain(draftPointId);
      expect(
        response.body.data.every(
          (point: { status: string }) => point.status !== 'PENDING',
        ),
      ).toBe(true);
    });
  });
});
