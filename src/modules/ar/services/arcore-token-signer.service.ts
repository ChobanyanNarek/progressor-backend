import { Injectable, Logger } from '@nestjs/common';
import jwt from 'jsonwebtoken';

import { ApiConfigService } from '../../../shared/services/api-config.service.ts';
import { ArcoreTokenSigningException } from '../exceptions/arcore-token-signing.exception.ts';

/** Exact audience ARCore requires — the trailing slash is significant. */
const ARCORE_AUDIENCE = 'https://arcore.googleapis.com/';
/** ARCore rejects tokens with a lifetime longer than one hour. */
const ARCORE_TOKEN_TTL_SECONDS = 3600;
/**
 * Re-mint this many seconds before expiry so a caller never receives a token
 * that is about to die (clock skew + the ~1h the client keeps using it).
 */
const ARCORE_TOKEN_REFRESH_SKEW_SECONDS = 300;

/** A minted token plus its absolute expiry — internal shape, not an API DTO. */
interface IArcoreToken {
  token: string;
  expiresAt: Date;
}

/**
 * Mints short-lived, self-signed service-account JWTs that let the mobile app
 * authenticate to Google's ARCore API without an API key, unlocking Cloud Anchor
 * TTLs beyond 24h. The signing is a local RS256 operation with the SA private
 * key — no IAM API call is needed. A still-valid token is cached in-process and
 * reused until it is within {@link ARCORE_TOKEN_REFRESH_SKEW_SECONDS} of expiry.
 */
@Injectable()
export class ArcoreTokenSigner {
  private readonly logger = new Logger(ArcoreTokenSigner.name);

  private cached: { token: string; expSec: number } | null = null;

  constructor(private readonly configService: ApiConfigService) {}

  mint(): IArcoreToken {
    const nowSec = Math.floor(Date.now() / 1000);

    if (
      this.cached &&
      this.cached.expSec - nowSec > ARCORE_TOKEN_REFRESH_SKEW_SECONDS
    ) {
      return {
        token: this.cached.token,
        expiresAt: new Date(this.cached.expSec * 1000),
      };
    }

    const expSec = nowSec + ARCORE_TOKEN_TTL_SECONDS;
    const token = this.sign(nowSec, expSec);
    this.cached = { token, expSec };

    return { token, expiresAt: new Date(expSec * 1000) };
  }

  private sign(iat: number, exp: number): string {
    const { signerEmail, privateKey, privateKeyId } =
      this.configService.arcoreConfig;

    try {
      return jwt.sign(
        {
          iss: signerEmail,
          sub: signerEmail,
          aud: ARCORE_AUDIENCE,
          iat,
          exp,
        },
        privateKey,
        { algorithm: 'RS256', keyid: privateKeyId },
      );
    } catch (error) {
      this.logger.error(
        `Failed to sign ARCore anchor token: ${(error as Error).message}`,
        (error as Error).stack,
      );

      throw new ArcoreTokenSigningException();
    }
  }
}
