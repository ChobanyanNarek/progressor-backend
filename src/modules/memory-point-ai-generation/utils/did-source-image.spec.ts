import { readFileSync } from 'node:fs';
import path from 'node:path';
import url from 'node:url';

import { describe, expect, it } from '@jest/globals';

import { detectImageFormat, toDidCompatibleImage } from './did-source-image.ts';

/*
 * import.meta.dirname is undefined under Jest's experimental ESM VM, so derive
 * the directory from import.meta.url instead.
 */
// eslint-disable-next-line unicorn/prefer-import-meta-properties
const moduleDir = path.dirname(url.fileURLToPath(import.meta.url));
const fixturesDir = path.join(moduleDir, '__fixtures__');

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const webp = Buffer.concat([
  Buffer.from('RIFF', 'ascii'),
  Buffer.from([0x00, 0x00, 0x00, 0x00]),
  Buffer.from('WEBP', 'ascii'),
]);
const heic = Buffer.concat([
  Buffer.from([0x00, 0x00, 0x00, 0x18]),
  Buffer.from('ftypheic', 'ascii'),
]);

describe('detectImageFormat', () => {
  it('detects jpeg / png / webp / heic from magic bytes', () => {
    expect(detectImageFormat(jpeg)).toBe('jpeg');
    expect(detectImageFormat(png)).toBe('png');
    expect(detectImageFormat(webp)).toBe('webp');
    expect(detectImageFormat(heic)).toBe('heic');
  });

  it('recognizes the common HEIF brands', () => {
    for (const brand of ['heix', 'mif1', 'msf1', 'heif']) {
      const buffer = Buffer.concat([
        Buffer.from([0x00, 0x00, 0x00, 0x18]),
        Buffer.from(`ftyp${brand}`, 'ascii'),
      ]);

      expect(detectImageFormat(buffer)).toBe('heic');
    }
  });

  it('returns unknown for unrecognized or truncated input', () => {
    expect(detectImageFormat(Buffer.from([0x00, 0x01, 0x02]))).toBe('unknown');
    expect(detectImageFormat(Buffer.alloc(0))).toBe('unknown');
  });
});

describe('toDidCompatibleImage', () => {
  it('passes a JPEG through untouched (no transcode)', async () => {
    const result = await toDidCompatibleImage(jpeg);

    expect(result).toBe(jpeg);
  });

  it('passes PNG and WebP through untouched', async () => {
    expect(await toDidCompatibleImage(png)).toBe(png);
    expect(await toDidCompatibleImage(webp)).toBe(webp);
  });

  it('transcodes a real HEIC file to JPEG', async () => {
    const heicBuffer = readFileSync(path.join(fixturesDir, 'tiny.heic'));
    expect(detectImageFormat(heicBuffer)).toBe('heic');

    const result = await toDidCompatibleImage(heicBuffer);

    expect(detectImageFormat(result)).toBe('jpeg');
    expect(result).not.toBe(heicBuffer);
  });
});
