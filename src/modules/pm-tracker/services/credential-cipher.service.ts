import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

import { Injectable, ServiceUnavailableException } from '@nestjs/common';

import { ApiConfigService } from '../../../shared/services/api-config.service.ts';

const VERSION = 'v1';
const IV_BYTES = 12; // the GCM standard nonce size

/**
 * Encrypts integration tokens at rest with AES-256-GCM. Each value gets a fresh random
 * nonce, and GCM's auth tag makes tampering detectable. Envelope: `v1.<iv>.<tag>.<data>`,
 * each part base64 -- versioned so the scheme can change without re-encrypting in place.
 */
@Injectable()
export class CredentialCipherService {
  constructor(private readonly config: ApiConfigService) {}

  get isAvailable(): boolean {
    return this.config.pmTrackerCredentialsKey !== null;
  }

  encrypt(plaintext: string): string {
    const key = this.requireKey();
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const data = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return [VERSION, iv, tag, data]
      .map((part) =>
        typeof part === 'string' ? part : part.toString('base64'),
      )
      .join('.');
  }

  decrypt(envelope: string): string {
    const key = this.requireKey();
    const [version, iv, tag, data] = envelope.split('.');

    if (version !== VERSION || !iv || !tag || !data) {
      throw new Error('Unrecognised credential envelope');
    }

    const decipher = createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(iv, 'base64'),
    );

    decipher.setAuthTag(Buffer.from(tag, 'base64'));

    return Buffer.concat([
      decipher.update(Buffer.from(data, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  }

  private requireKey(): Buffer {
    const key = this.config.pmTrackerCredentialsKey;

    if (!key) {
      throw new ServiceUnavailableException('error.credentialVaultUnavailable');
    }

    return key;
  }
}
