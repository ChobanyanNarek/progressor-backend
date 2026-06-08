import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { GcsStorageService } from './gcs-storage.service.ts';

describe('GcsStorageService', () => {
  let service: GcsStorageService;
  let getSignedUrl: jest.Mock<
    (options: Record<string, unknown>) => Promise<[string]>
  >;

  const apiConfigService = {
    gcpConfig: {
      projectId: 'proj',
      bucket: 'bucket',
      maxUploadBytes: 1000,
    },
  };

  beforeEach(() => {
    getSignedUrl =
      jest.fn<(options: Record<string, unknown>) => Promise<[string]>>();
    getSignedUrl.mockResolvedValue(['https://signed.example']);

    service = new GcsStorageService(apiConfigService as never);

    /*
     * The real Storage client only authenticates lazily inside getSignedUrl, so
     * we swap it for a fake to assert the signing options without hitting GCP.
     */
    const fakeStorage = {
      bucket: () => ({ file: () => ({ getSignedUrl }) }),
    };
    (service as unknown as { storage: typeof fakeStorage }).storage =
      fakeStorage;
  });

  describe('getSignedReadUrl', () => {
    it('signs with V4 — V2 signatures are rejected when signing via IAM signBlob', async () => {
      const url = await service.getSignedReadUrl(
        'memory-points/a/photo/b.jpeg',
      );

      expect(url).toBe('https://signed.example');
      expect(getSignedUrl).toHaveBeenCalledTimes(1);
      const options = getSignedUrl.mock.calls[0]![0];
      expect(options).toMatchObject({ version: 'v4', action: 'read' });
    });
  });

  describe('getSignedWriteUrl', () => {
    it('signs with V4 and binds the content type', async () => {
      await service.getSignedWriteUrl(
        'memory-points/a/photo/b.jpeg',
        'image/jpeg',
      );

      expect(getSignedUrl).toHaveBeenCalledTimes(1);
      const options = getSignedUrl.mock.calls[0]![0];
      expect(options).toMatchObject({
        version: 'v4',
        action: 'write',
        contentType: 'image/jpeg',
      });
    });
  });
});
