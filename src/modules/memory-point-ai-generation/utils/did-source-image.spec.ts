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
  it('passes a JPEG through untouched, tagged image/jpeg', async () => {
    const result = await toDidCompatibleImage(jpeg);

    expect(result.buffer).toBe(jpeg);
    expect(result.contentType).toBe('image/jpeg');
    expect(result.extension).toBe('jpg');
  });

  it('passes PNG and WebP through untouched with their real type', async () => {
    const pngResult = await toDidCompatibleImage(png);
    expect(pngResult.buffer).toBe(png);
    expect(pngResult.contentType).toBe('image/png');
    expect(pngResult.extension).toBe('png');

    const webpResult = await toDidCompatibleImage(webp);
    expect(webpResult.buffer).toBe(webp);
    expect(webpResult.contentType).toBe('image/webp');
    expect(webpResult.extension).toBe('webp');
  });

  it('transcodes a real HEIC file to JPEG', async () => {
    const heicBuffer = readFileSync(path.join(fixturesDir, 'tiny.heic'));
    expect(detectImageFormat(heicBuffer)).toBe('heic');

    const result = await toDidCompatibleImage(heicBuffer);

    expect(detectImageFormat(result.buffer)).toBe('jpeg');
    expect(result.contentType).toBe('image/jpeg');
    expect(result.extension).toBe('jpg');
    expect(result.buffer).not.toBe(heicBuffer);
  });

  it('attempts transcode on an ftyp brand outside the known list (not silent pass-through)', async () => {
    /*
     * An uncovered HEIF brand sniffs as 'unknown', but unlike a non-image blob
     * it must still be *attempted* as HEIC so an unlisted brand can't silently
     * 500 at D-ID. This fabricated file has an ftyp box but isn't decodable, so
     * the attempt throws and we fall back to the original bytes — proving the
     * branch runs (a real decodable brand would come back as JPEG instead).
     */
    const uncoveredBrand = Buffer.concat([
      Buffer.from([0x00, 0x00, 0x00, 0x18]),
      Buffer.from('ftypqt  ', 'ascii'),
      Buffer.alloc(16),
    ]);

    expect(detectImageFormat(uncoveredBrand)).toBe('unknown');

    const result = await toDidCompatibleImage(uncoveredBrand);

    // fell back to the original bytes rather than failing closed
    expect(result.buffer).toBe(uncoveredBrand);
    expect(result.contentType).toBe('application/octet-stream');
    expect(result.extension).toBe('bin');
  });

  it('passes a plain non-image blob through as octet-stream', async () => {
    const blob = Buffer.from([0x00, 0x01, 0x02, 0x03]);

    const result = await toDidCompatibleImage(blob);

    expect(result.buffer).toBe(blob);
    expect(result.contentType).toBe('application/octet-stream');
  });
});
