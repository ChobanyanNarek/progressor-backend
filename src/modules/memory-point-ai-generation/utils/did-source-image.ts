import convert from 'heic-convert';

/**
 * Image container formats relevant to the D-ID source image.
 *
 * D-ID decodes JPEG / PNG / WebP but **not** HEIC/HEIF. iPhones capture HEIC and
 * the client uploads those bytes under a `.jpg` path, so the source image must
 * be sniffed by content (not extension) and transcoded when it is HEIC, or D-ID
 * rejects the talk at create time with a 500.
 */
export type DetectedImageFormat = 'jpeg' | 'png' | 'webp' | 'heic' | 'unknown';

/** Sniff the image container from its magic bytes (extension is unreliable). */
export function detectImageFormat(buffer: Buffer): DetectedImageFormat {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'jpeg';
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'png';
  }

  // RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }

  // ISO-BMFF: bytes 4..8 are 'ftyp', major brand follows at 8..12.
  if (buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buffer.toString('ascii', 8, 12);
    const heicBrands = new Set([
      'heic',
      'heix',
      'heim',
      'heis',
      'hevc',
      'hevx',
      'heif',
      'mif1',
      'msf1',
    ]);

    if (heicBrands.has(brand)) {
      return 'heic';
    }
  }

  return 'unknown';
}

/**
 * Return a D-ID-compatible image buffer for the given source bytes.
 *
 * HEIC/HEIF is transcoded to JPEG (D-ID can't decode it); JPEG/PNG/WebP are
 * already supported and pass through untouched. `heic-convert` is used rather
 * than `sharp` because the bundled `sharp` binary has no libheif decoder.
 */
export async function toDidCompatibleImage(buffer: Buffer): Promise<Buffer> {
  if (detectImageFormat(buffer) !== 'heic') {
    return buffer;
  }

  // A Node Buffer is a Uint8Array, which is what heic-convert expects.
  const jpeg = await convert({ buffer, format: 'JPEG', quality: 0.9 });

  return Buffer.from(jpeg);
}
