import { UnprocessableEntityException } from '@nestjs/common';

/**
 * Raised when D-ID rejects the talk at create time with a 4xx — i.e. the source
 * media we sent was unfetchable/undecodable/invalid. Distinct from
 * `AiGenerationFailedException` (500) because this is **client-recoverable**:
 * the user can re-upload a valid photo/audio. Carries a stable code per
 * ADR-0015; the provider detail is passed as the optional `description` for
 * logs, never as a localized message.
 */
export class AiGenerationInvalidMediaException extends UnprocessableEntityException {
  constructor(error?: string) {
    super('error.aiGenerationInvalidMedia', error);
  }
}
