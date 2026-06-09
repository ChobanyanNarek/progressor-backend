/** biome-ignore-all lint/style/useNamingConvention: fixtures mirror D-ID's snake_case wire payload */
import { beforeEach, describe, expect, it } from '@jest/globals';
import {
  type ArgumentMetadata,
  HttpStatus,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';

import { DidWebhookDto } from './did-webhook.dto.ts';

/**
 * The 422 that left D-ID talks stuck at PROCESSING happened in the global
 * ValidationPipe, not the controller — so the regression must run a real
 * D-ID payload through a pipe configured exactly like `src/main.ts`.
 */
describe('DidWebhookDto validation', () => {
  let pipe: ValidationPipe;

  const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: DidWebhookDto,
  };

  beforeEach(() => {
    pipe = new ValidationPipe({
      whitelist: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      transform: true,
      dismissDefaultMessages: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => new UnprocessableEntityException(errors),
    });
  });

  /*
   * Full talk object D-ID POSTs on the `error` status change. Includes
   * `pending_url`, the field whose absence from the whitelist caused the 422.
   */
  const erroredTalkPayload = {
    id: 'tlk_pLHhSBqqlfxWSW-NqBwaG',
    status: 'error',
    error: { kind: 'FaceError', description: 'face not detected' },
    user_data: '7723cad3-0119-4cd4-9989-dda69fac1156',
    duration: 3.459_773,
    audio_url: 'https://example.com/audio.wav',
    source_url: 'https://example.com/source.jpg',
    driver_url: 'bank://natural/',
    webhook: 'https://api-dev.example.com/webhooks/did/secret',
    pending_url: 's3://d-id-talks-prod/owner/tlk_pLHhSBqqlfxWSW-NqBwaG/1.mp4',
    created_at: '2026-06-09T13:48:40.440Z',
    created_by: 'google-oauth2|111',
    modified_at: '2026-06-09T13:48:52.571Z',
    started_at: '2026-06-09T13:48:51.087',
    user_id: 'google-oauth2|111',
    subtitles: false,
    config: { result_format: '.mp4' },
    script: { type: 'audio' },
    user: { email: 'henri.pook@gmail.com' },
  };

  it('accepts a D-ID error webhook payload that includes pending_url', async () => {
    const result = await pipe.transform(erroredTalkPayload, metadata);

    expect(result).toBeInstanceOf(DidWebhookDto);
    expect(result.id).toBe('tlk_pLHhSBqqlfxWSW-NqBwaG');
    expect(result.status).toBe('error');
    expect(result.pending_url).toBe(erroredTalkPayload.pending_url);
  });

  it('accepts a D-ID done webhook payload with result_url', async () => {
    const result = await pipe.transform(
      {
        id: 'tlk_done',
        status: 'done',
        result_url: 'https://example.com/result.mp4',
        duration: 4,
        pending_url: 's3://d-id-talks-prod/owner/tlk_done/1.mp4',
      },
      metadata,
    );

    expect(result.status).toBe('done');
    expect(result.result_url).toBe('https://example.com/result.mp4');
  });

  it('still rejects a genuinely unknown field', async () => {
    await expect(
      pipe.transform(
        { id: 'tlk_x', status: 'error', totally_unknown_field: 'nope' },
        metadata,
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('rejects a payload missing the required id', async () => {
    await expect(
      pipe.transform({ status: 'error' }, metadata),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });
});
