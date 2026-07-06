import { InternalServerErrorException } from '@nestjs/common';

/**
 * Raised when signing the ARCore service-account JWT fails (missing/invalid
 * signer private key, crypto error). Carries a stable error code per ADR-0015 —
 * the real cause is logged server-side and passed as the optional `description`,
 * never surfaced to the client.
 */
export class ArcoreTokenSigningException extends InternalServerErrorException {
  constructor(error?: string) {
    super('error.arcoreTokenSigningFailed', error);
  }
}
