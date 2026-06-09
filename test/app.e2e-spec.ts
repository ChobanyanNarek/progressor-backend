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

    it('admin list row carries userId, type, photoUrl and an embedded creator (§2.1/§2.2)', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/memory-points?take=50')
        .set(authHeader(adminToken))
        .expect(200);

      const completed = response.body.data.find(
        (point: { id: string }) => point.id === completedPointId,
      ) as {
        userId: string;
        type: string;
        photoUrl: string | null;
        creator: {
          id: string;
          firstName: string;
          lastName: string;
          email: string;
        };
      };

      expect(completed).toBeDefined();
      expect(typeof completed.userId).toBe('string');
      expect(completed.type).toBe('MEMORIAL');
      // photoUrl is the source thumbnail (string) or null when no media uploaded.
      expect(
        completed.photoUrl === null || typeof completed.photoUrl === 'string',
      ).toBe(true);
      expect(completed.creator).toBeDefined();
      expect(typeof completed.creator.id).toBe('string');
      expect(typeof completed.creator.firstName).toBe('string');
      expect(typeof completed.creator.lastName).toBe('string');
      expect(typeof completed.creator.email).toBe('string');
    });

    it('admin GET-by-id embeds the creator and userId matches creator.id (§2.2)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/memory-points/${completedPointId}`)
        .set(authHeader(adminToken))
        .expect(200);

      const body = response.body as {
        userId: string;
        creator: {
          id: string;
          firstName: string;
          lastName: string;
          email: string;
        };
      };

      expect(body.creator).toBeDefined();
      expect(typeof body.creator.id).toBe('string');
      expect(typeof body.creator.firstName).toBe('string');
      expect(typeof body.creator.lastName).toBe('string');
      expect(typeof body.creator.email).toBe('string');
      expect(body.userId).toBe(body.creator.id);
    });
  });

  describe('GET /admin/logs', () => {
    it('rejects a non-admin (creator) token with 403 (RolesGuard)', async () => {
      await request(app.getHttpServer())
        .get('/admin/logs')
        .set(authHeader(creatorToken))
        .expect(403);
    });

    it('returns the standard envelope with per-source counts for admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/logs')
        .set(authHeader(adminToken))
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toBeDefined();

      const counts = response.body.meta.counts as Record<string, number>;
      expect(counts).toBeDefined();

      // Empty table -> every source count is present and zero.
      for (const key of ['api', 'ar', 'did', 'maps', 'auth']) {
        expect(counts[key]).toBe(0);
      }
    });

    it('passes through level/source/take filters and keeps the envelope', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/logs?level=error&source=api&take=5')
        .set(authHeader(adminToken))
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.counts).toBeDefined();
    });

    it('rejects an inverted time window (from > to) with 422', async () => {
      await request(app.getHttpServer())
        .get(
          '/admin/logs?from=2026-02-01T00:00:00.000Z&to=2026-01-01T00:00:00.000Z',
        )
        .set(authHeader(adminToken))
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('GET /admin/jobs', () => {
    it('rejects a non-admin (creator) token with 403 (RolesGuard)', async () => {
      await request(app.getHttpServer())
        .get('/admin/jobs')
        .set(authHeader(creatorToken))
        .expect(403);
    });

    it('returns an empty data array with a meta envelope for admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/jobs')
        .set(authHeader(adminToken))
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.meta).toBeDefined();
    });

    it('accepts the status filter and keeps the envelope', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/jobs?status=PENDING')
        .set(authHeader(adminToken))
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toBeDefined();
    });
  });

  describe('admin upserts details on a fresh PENDING point (§2.3 regression)', () => {
    let pendingPointId: string;

    it('creator creates a fresh PENDING point with no details row', async () => {
      const response = await request(app.getHttpServer())
        .post('/creator/memory-points')
        .set(authHeader(creatorToken))
        .send({ latitude: 42.2, longitude: 43.3 })
        .expect(201);

      expect(response.body.status).toBe('PENDING');
      pendingPointId = (response.body as { id: string }).id;
    });

    it('admin PATCH details on the detail-less point returns 204 (was 404)', async () => {
      await request(app.getHttpServer())
        .patch(`/admin/memory-points/${pendingPointId}/details`)
        .set(authHeader(adminToken))
        .send({
          title: 'Admin set title',
          description: 'desc',
          type: 'GRAVE',
        })
        .expect(204);
    });

    it('persists the admin-set details and leaves the point PENDING', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/memory-points/${pendingPointId}`)
        .set(authHeader(adminToken))
        .expect(200);

      const body = response.body as {
        status: string;
        memoryPointDetails: { title: string; type: string };
      };

      // Admin GET-by-id returns PENDING points (no status restriction).
      expect(body.status).toBe('PENDING');
      expect(body.memoryPointDetails.title).toBe('Admin set title');
      expect(body.memoryPointDetails.type).toBe('GRAVE');
    });

    it('second PATCH (description only) is 204 and preserves the title', async () => {
      await request(app.getHttpServer())
        .patch(`/admin/memory-points/${pendingPointId}/details`)
        .set(authHeader(adminToken))
        .send({ description: 'updated' })
        .expect(204);

      const response = await request(app.getHttpServer())
        .get(`/admin/memory-points/${pendingPointId}`)
        .set(authHeader(adminToken))
        .expect(200);

      const body = response.body as {
        memoryPointDetails: {
          title: string;
          description: string;
          type: string;
        };
      };

      // Update branch only touches provided fields; title/type are preserved.
      expect(body.memoryPointDetails.title).toBe('Admin set title');
      expect(body.memoryPointDetails.type).toBe('GRAVE');
      expect(body.memoryPointDetails.description).toBe('updated');
    });
  });
});
