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

/** A D-ID-ready image plus the MIME type / extension that match its bytes. */
export interface INormalizedDidImage {
  buffer: Buffer;
  contentType: string;
  extension: string;
}

const PASSTHROUGH: Record<
  'jpeg' | 'png' | 'webp',
  { contentType: string; extension: string }
> = {
  jpeg: { contentType: 'image/jpeg', extension: 'jpg' },
  png: { contentType: 'image/png', extension: 'png' },
  webp: { contentType: 'image/webp', extension: 'webp' },
};

/**
 * JPEG quality for the HEIC transcode. 0.9 keeps faces crisp enough for D-ID's
 * face detector while roughly halving size vs lossless; D-ID re-encodes the
 * frame anyway, so there is no point shipping a larger near-lossless JPEG.
 */
const JPEG_QUALITY = 0.9;

/** Whether the buffer starts with an ISO-BMFF `ftyp` box (HEIF, MP4, …). */
function hasFtypBox(buffer: Buffer): boolean {
  return buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp';
}

async function transcodeToJpeg(buffer: Buffer): Promise<Buffer> {
  /*
   * heic-convert is libheif compiled to WASM and decodes **synchronously** — it
   * blocks the event loop for the duration of the decode. That is acceptable on
   * the admin-only generate-video path (low volume, one image per request).
   * Follow-up (asset-pipeline): offload to a worker thread if this ever leaves
   * the admin path or starts handling large/concurrent images.
   *
   * A Node Buffer is a Uint8Array, which is what heic-convert expects.
   */
  const jpeg = await convert({ buffer, format: 'JPEG', quality: JPEG_QUALITY });

  return Buffer.from(jpeg);
}

/**
 * Return a D-ID-compatible image (bytes + matching MIME/extension) for the given
 * source bytes.
 *
 * - JPEG / PNG / WebP are already supported and pass through untouched, tagged
 *   with their real type so the `/images` upload isn't mislabeled.
 * - HEIC/HEIF is transcoded to JPEG — D-ID can't decode it and 500s otherwise.
 *   `heic-convert` is used rather than `sharp` because the bundled `sharp`
 *   binary has no libheif decoder.
 * - Any other `ftyp`-boxed container (a HEIF variant whose major brand we don't
 *   recognize) is *attempted* as HEIC and falls back to pass-through if it turns
 *   out not to be decodable, so an unlisted brand can't silently 500 at D-ID.
 */
export async function toDidCompatibleImage(
  buffer: Buffer,
): Promise<INormalizedDidImage> {
  const format = detectImageFormat(buffer);

  if (format === 'jpeg' || format === 'png' || format === 'webp') {
    return { buffer, ...PASSTHROUGH[format] };
  }

  if (format === 'heic' || hasFtypBox(buffer)) {
    try {
      return {
        buffer: await transcodeToJpeg(buffer),
        contentType: 'image/jpeg',
        extension: 'jpg',
      };
    } catch {
      /*
       * Not actually decodable as HEIF — hand the original bytes to D-ID and
       * let it make the final call rather than failing closed here.
       */
    }
  }

  return { buffer, contentType: 'application/octet-stream', extension: 'bin' };
}
