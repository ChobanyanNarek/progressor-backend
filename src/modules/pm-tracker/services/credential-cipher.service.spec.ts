import { randomBytes } from 'node:crypto';

import { describe, expect, it } from '@jest/globals';
import { ServiceUnavailableException } from '@nestjs/common';

import { CredentialCipherService } from './credential-cipher.service.ts';

const withKey = (key: Buffer | null): CredentialCipherService =>
  new CredentialCipherService({ pmTrackerCredentialsKey: key } as never);

describe('CredentialCipherService', () => {
  it('round-trips a token', () => {
    const cipher = withKey(randomBytes(32));

    expect(cipher.decrypt(cipher.encrypt('ATATT-token'))).toBe('ATATT-token');
  });

  it('never stores the plaintext and uses a fresh nonce every time', () => {
    const cipher = withKey(randomBytes(32));
    const a = cipher.encrypt('same-token');
    const b = cipher.encrypt('same-token');

    expect(a).not.toContain('same-token');
    expect(a).not.toBe(b);
  });

  it('rejects a tampered envelope', () => {
    const cipher = withKey(randomBytes(32));
    const [v, iv, tag, data] = cipher.encrypt('token').split('.');
    const flipped = Buffer.from(data!, 'base64');

    flipped[0] = (flipped[0]! + 1) % 256;

    expect(() =>
      cipher.decrypt([v, iv, tag, flipped.toString('base64')].join('.')),
    ).toThrow();
  });

  it('cannot decrypt with a different key', () => {
    const envelope = withKey(randomBytes(32)).encrypt('token');

    expect(() => withKey(randomBytes(32)).decrypt(envelope)).toThrow();
  });

  it('reports itself unavailable and refuses to work without a key', () => {
    const cipher = withKey(null);

    expect(cipher.isAvailable).toBe(false);
    expect(() => cipher.encrypt('token')).toThrow(ServiceUnavailableException);
  });
});
