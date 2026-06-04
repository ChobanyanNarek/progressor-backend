/** biome-ignore-all lint/style/useNamingConvention: <explanation> */
import { Allow } from 'class-validator';

import {
  ClassFieldOptional,
  NumberFieldOptional,
  StringField,
  StringFieldOptional,
} from '../../../decorators/field.decorators.ts';

export class DidWebhookErrorDto {
  @StringFieldOptional()
  kind?: string;

  @StringFieldOptional()
  description?: string;
}

/**
 * D-ID talk webhook payload. D-ID POSTs the full talk object on every status
 * change, so the same shape covers both success (`status: done`, `result_url`)
 * and failure (`status: error|rejected`, `error`).
 *
 * Notes:
 * - Property names are D-ID's snake_case wire keys — request bodies are not
 *   case-transformed, so the names must match exactly.
 * - We only act on `id`; the other talk attributes are `@Allow()`-ed so the
 *   strict global ValidationPipe (`forbidNonWhitelisted`) keeps them instead of
 *   rejecting the request, without validating fields we never read.
 */
export class DidWebhookDto {
  /** Talk id — the field we act on (enqueue result processing). */
  @StringField()
  id!: string;

  @StringField()
  status!: string;

  @StringFieldOptional()
  result_url?: string;

  @ClassFieldOptional(() => DidWebhookErrorDto)
  error?: DidWebhookErrorDto;

  /** Echoed back from createTalk — our ai-generation row id. */
  @StringFieldOptional()
  user_data?: string;

  /** Result video length in seconds. */
  @NumberFieldOptional()
  duration?: number;

  @Allow()
  audio_url?: string;

  @Allow()
  source_url?: string;

  @Allow()
  driver_url?: string;

  @Allow()
  webhook?: string;

  @Allow()
  object?: string;

  @Allow()
  created_at?: string;

  @Allow()
  created_by?: string;

  @Allow()
  modified_at?: string;

  @Allow()
  started_at?: string;

  @Allow()
  completed_at?: string;

  @Allow()
  user_id?: string;

  @Allow()
  subtitles?: boolean;

  @Allow()
  config?: Record<string, unknown>;

  @Allow()
  script?: Record<string, unknown>;

  @Allow()
  user?: Record<string, unknown>;

  @Allow()
  face?: Record<string, unknown>;

  @Allow()
  metadata?: Record<string, unknown>;
}
