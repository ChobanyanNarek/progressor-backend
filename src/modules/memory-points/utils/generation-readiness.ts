/**
 * Fields a memory point must have populated before AI video generation can run.
 * Kept as a pure helper (no DB / framework deps) so the generate command can own
 * the readiness check while the source query stays a plain read.
 */

/** The generation-relevant details, as read from storage (any may be unset). */
export interface IMemoryPointGenerationFields {
  sourcePhotoUrl: string | null;
  sourceAudioUrl: string | null;
  title: string | null;
  description: string | null;
}

/**
 * Returns the identifiers of the required inputs that are missing/empty, in a
 * stable order. Empty array means the point is ready to generate. The returned
 * identifiers are the `missingFields` contract surfaced to the admin frontend.
 *
 * Required: `title`, `sourcePhotoUrl` (face), and **a script** — either a
 * `description` (D-ID synthesizes the voice via TTS) or an uploaded
 * `sourceAudioUrl`. When neither script source is present a single
 * `descriptionOrAudio` token is returned (only one is needed, so listing both
 * would mislead).
 */
export function collectMissingGenerationFields(
  fields: IMemoryPointGenerationFields,
): string[] {
  const missingFields: string[] = [];

  if (!fields.title) {
    missingFields.push('title');
  }

  if (!fields.sourcePhotoUrl) {
    missingFields.push('sourcePhotoUrl');
  }

  if (!fields.description && !fields.sourceAudioUrl) {
    missingFields.push('descriptionOrAudio');
  }

  return missingFields;
}
