import { jest } from '@jest/globals';
import { of } from 'rxjs';

import { DidService } from './did.service.ts';

const didConfig = {
  apiKey: 'api-key-123',
  baseUrl: 'https://api.d-id.com/',
  webhookUrl: 'https://example.com/webhooks/did/',
  webhookSecret: 'super-secret',
};

describe('DidService', () => {
  let httpService: { post: jest.Mock; get: jest.Mock };
  let service: DidService;

  beforeEach(() => {
    httpService = { post: jest.fn(), get: jest.fn() };
    const apiConfigService = { didConfig };
    service = new DidService(httpService as never, apiConfigService as never);
  });

  describe('webhookEndpoint', () => {
    it('joins webhookUrl (trailing slash stripped) with the secret', () => {
      expect(service.webhookEndpoint).toBe(
        'https://example.com/webhooks/did/super-secret',
      );
    });
  });

  describe('createTalk', () => {
    it('POSTs to {baseUrl}/talks with the expected body/headers and normalizes the result', async () => {
      httpService.post.mockReturnValue(
        of({
          data: {
            id: 'talk-1',
            status: 'created',
            result_url: 'https://cdn/result.mp4',
            duration: 12,
          },
        }),
      );

      const result = await service.createTalk({
        sourceUrl: 'https://src/photo.jpg',
        audioUrl: 'https://src/audio.mp3',
        userData: 'point-1',
      });

      expect(httpService.post).toHaveBeenCalledTimes(1);
      const [url, body, config] = httpService.post.mock.calls[0];
      // trailing slash on baseUrl is stripped
      expect(url).toBe('https://api.d-id.com/talks');
      expect(body).toEqual({
        source_url: 'https://src/photo.jpg',
        script: { type: 'audio', audio_url: 'https://src/audio.mp3' },
        webhook: 'https://example.com/webhooks/did/super-secret',
        user_data: 'point-1',
      });
      expect(config).toEqual({
        headers: { Authorization: 'Basic api-key-123' },
      });

      expect(result).toEqual({
        id: 'talk-1',
        status: 'created',
        resultUrl: 'https://cdn/result.mp4',
        error: undefined,
        durationSeconds: 12,
      });
    });
  });

  describe('getTalk', () => {
    it('GETs {baseUrl}/talks/{id} with auth header and normalizes the result', async () => {
      httpService.get.mockReturnValue(
        of({
          data: {
            id: 'talk-9',
            status: 'done',
            result_url: 'https://cdn/done.mp4',
            duration: 5,
          },
        }),
      );

      const result = await service.getTalk('talk-9');

      expect(httpService.get).toHaveBeenCalledTimes(1);
      const [url, config] = httpService.get.mock.calls[0];
      expect(url).toBe('https://api.d-id.com/talks/talk-9');
      expect(config).toEqual({
        headers: { Authorization: 'Basic api-key-123' },
      });

      expect(result).toEqual({
        id: 'talk-9',
        status: 'done',
        resultUrl: 'https://cdn/done.mp4',
        error: undefined,
        durationSeconds: 5,
      });
    });
  });

  describe('normalize', () => {
    it('coerces numeric id/status to String and leaves missing result_url/duration undefined', async () => {
      httpService.get.mockReturnValue(
        of({
          data: {
            id: 12_345,
            status: 'error',
            error: { kind: 'boom' },
          },
        }),
      );

      const result = await service.getTalk('whatever');

      expect(result.id).toBe('12345');
      expect(typeof result.id).toBe('string');
      expect(result.status).toBe('error');
      expect(result.resultUrl).toBeUndefined();
      expect(result.durationSeconds).toBeUndefined();
      expect(result.error).toEqual({ kind: 'boom' });
    });
  });
});
