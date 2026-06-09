import { InternalServerErrorException } from '@nestjs/common';

/**
 * Raised when starting a D-ID talk fails (provider rejected the request,
 * unsupported/undecodable source media, network error, …). Carries a stable
 * error code per ADR-0015 — the underlying provider detail is passed as the
 * optional `description` for logs, never surfaced as a localized message.
 */
export class AiGenerationFailedException extends InternalServerErrorException {
  constructor(error?: string) {
    super('error.aiGenerationFailed', error);
  }
}
