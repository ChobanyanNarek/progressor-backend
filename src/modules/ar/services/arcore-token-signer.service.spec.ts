import { generateKeyPairSync } from 'node:crypto';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import jwt from 'jsonwebtoken';

import type { ApiConfigService } from '../../../shared/services/api-config.service.ts';
import { ArcoreTokenSigningException } from '../exceptions/arcore-token-signing.exception.ts';
import { ArcoreTokenSigner } from './arcore-token-signer.service.ts';

const AUDIENCE = 'https://arcore.googleapis.com/';
const SIGNER_EMAIL =
  'arcore-anchor-signer@test-project.iam.gserviceaccount.com';
const PRIVATE_KEY_ID = 'test-private-key-id-123';

const configWith = (privateKey: string): ApiConfigService =>
  ({
    arcoreConfig: {
      signerEmail: SIGNER_EMAIL,
      privateKey,
      privateKeyId: PRIVATE_KEY_ID,
    },
  }) as unknown as ApiConfigService;

describe('ArcoreTokenSigner', () => {
  let publicKey: string;
  let signer: ArcoreTokenSigner;

  beforeEach(() => {
    const keyPair = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    publicKey = keyPair.publicKey;
    signer = new ArcoreTokenSigner(configWith(keyPair.privateKey));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('signs a header carrying alg RS256, typ JWT and the private-key id as kid', () => {
    const { token } = signer.mint();
    const decoded = jwt.decode(token, { complete: true });

    expect(decoded?.header).toMatchObject({
      alg: 'RS256',
      typ: 'JWT',
      kid: PRIVATE_KEY_ID,
    });
  });

  it('emits the exact ARCore claim set (iss=sub=email, aud, 1h lifetime)', () => {
    const { token } = signer.mint();
    const payload = jwt.decode(token) as jwt.JwtPayload;

    expect(payload.iss).toBe(SIGNER_EMAIL);
    expect(payload.sub).toBe(SIGNER_EMAIL);
    expect(payload.aud).toBe(AUDIENCE);
    expect((payload.exp ?? 0) - (payload.iat ?? 0)).toBe(3600);
  });

  it('produces a signature that verifies against the SA public cert', () => {
    const { token } = signer.mint();

    const verified = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      audience: AUDIENCE,
      issuer: SIGNER_EMAIL,
    }) as jwt.JwtPayload;

    expect(verified.sub).toBe(SIGNER_EMAIL);
  });

  it('reports expiresAt as exactly the token exp claim', () => {
    const { token, expiresAt } = signer.mint();
    const payload = jwt.decode(token) as jwt.JwtPayload;

    expect(Math.floor(expiresAt.getTime() / 1000)).toBe(payload.exp);
  });

  it('reuses the cached token while it is still comfortably valid', () => {
    const first = signer.mint();
    const second = signer.mint();

    expect(second.token).toBe(first.token);
  });

  it('re-mints once the cached token enters the 5-minute refresh window', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-06T00:00:00.000Z'));
    const first = signer.mint();

    // 56m40s later → 200s before exp, inside the 300s skew → must re-mint.
    jest.setSystemTime(new Date('2026-07-06T00:56:40.000Z'));
    const second = signer.mint();

    expect(second.token).not.toBe(first.token);
  });

  it('wraps signing failures in ArcoreTokenSigningException', () => {
    const badSigner = new ArcoreTokenSigner(configWith('not-a-valid-pem-key'));

    expect(() => badSigner.mint()).toThrow(ArcoreTokenSigningException);
  });
});
