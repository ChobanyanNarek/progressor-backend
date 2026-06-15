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
 * Returns the identifiers of the required fields that are missing/empty, in a
 * stable order. Empty array means the point is ready to generate. The returned
 * identifiers are the `missingFields` contract surfaced to the admin frontend.
 */
export function collectMissingGenerationFields(
  fields: IMemoryPointGenerationFields,
): string[] {
  const missingFields: string[] = [];

  if (!fields.sourcePhotoUrl) {
    missingFields.push('sourcePhotoUrl');
  }

  if (!fields.sourceAudioUrl) {
    missingFields.push('sourceAudioUrl');
  }

  if (!fields.title) {
    missingFields.push('title');
  }

  if (!fields.description) {
    missingFields.push('description');
  }

  return missingFields;
}
