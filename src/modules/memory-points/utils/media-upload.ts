import { AudioFileType } from '../../../constants/audio-file-type.ts';
import { PhotoFileType } from '../../../constants/photo-file-type.ts';
import type { GcsStorageService } from '../../../shared/services/gcs-storage.service.ts';
import { MemoryPointSourceNotUploadedException } from '../exceptions/memory-point-source-not-uploaded.exception.ts';

/**
 * Shared media-upload helpers for the creator and admin upload-url handlers and
 * the detail-submit/edit guards. Single source of truth for the MIME mapping,
 * GCS object-path layout and source-path validation so the two flows cannot
 * drift apart.
 */

/** MIME type the browser must PUT with, per accepted photo extension. */
export const PHOTO_MIME_BY_TYPE: Record<PhotoFileType, string> = {
  [PhotoFileType.JPG]: 'image/jpeg',
  [PhotoFileType.JPEG]: 'image/jpeg',
  [PhotoFileType.PNG]: 'image/png',
};

/** MIME type the browser must PUT with, per accepted audio extension. */
export const AUDIO_MIME_BY_TYPE: Record<AudioFileType, string> = {
  [AudioFileType.MP3]: 'audio/mpeg',
  [AudioFileType.WAV]: 'audio/wav',
  [AudioFileType.M4A]: 'audio/mp4',
};

/** GCS prefix under which a point's source photos live. */
export const photoPrefix = (memoryPointId: Uuid): string =>
  `memory-points/${memoryPointId}/photo/`;

/** GCS prefix under which a point's source audio lives. */
export const audioPrefix = (memoryPointId: Uuid): string =>
  `memory-points/${memoryPointId}/audio/`;

/**
 * Build a unique object path for a freshly uploaded source file. The path ends
 * in the file-type extension (D-ID validates the URL suffix); the URL is signed
 * separately with the real MIME type.
 */
export const buildPhotoPath = (
  memoryPointId: Uuid,
  uuid: string,
  ext: PhotoFileType,
): string => `${photoPrefix(memoryPointId)}${uuid}.${ext}`;

export const buildAudioPath = (
  memoryPointId: Uuid,
  uuid: string,
  ext: AudioFileType,
): string => `${audioPrefix(memoryPointId)}${uuid}.${ext}`;

/** Treat an empty/blank string path as "not provided". */
export const normalizeOptionalPath = (
  value?: string | null,
): string | undefined => (value && value.trim() !== '' ? value : undefined);

/**
 * For each source path that IS provided, require it to live under this memory
 * point's own prefix (so a caller cannot reference another point's object) and
 * confirm the object actually exists in storage. Omitted paths are skipped.
 * Throws {@link MemoryPointSourceNotUploadedException} on any violation.
 */
export async function assertProvidedSourcesValid(
  gcsStorageService: Pick<GcsStorageService, 'exists'>,
  memoryPointId: Uuid,
  sources: { sourcePhotoUrl?: string; sourceAudioUrl?: string },
): Promise<void> {
  const { sourcePhotoUrl, sourceAudioUrl } = sources;

  if (
    (sourcePhotoUrl &&
      !sourcePhotoUrl.startsWith(photoPrefix(memoryPointId))) ||
    (sourceAudioUrl && !sourceAudioUrl.startsWith(audioPrefix(memoryPointId)))
  ) {
    throw new MemoryPointSourceNotUploadedException();
  }

  const [hasPhoto, hasAudio] = await Promise.all([
    sourcePhotoUrl
      ? gcsStorageService.exists(sourcePhotoUrl)
      : Promise.resolve(true),
    sourceAudioUrl
      ? gcsStorageService.exists(sourceAudioUrl)
      : Promise.resolve(true),
  ]);

  if (!hasPhoto || !hasAudio) {
    throw new MemoryPointSourceNotUploadedException();
  }
}
