import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';

/**
 * Raised when an admin triggers AI generation on a memory point that is missing
 * one or more required fields (source photo, source audio, title, description).
 *
 * Carries a stable code per ADR-0015, plus a `missingFields` array so the admin
 * frontend can point the user at exactly what to fill in — the field names are
 * stable identifiers, not localized copy.
 */
export class MemoryPointNotReadyForGenerationException extends UnprocessableEntityException {
  constructor(missingFields: readonly string[]) {
    super({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: 'error.memoryPointNotReadyForGeneration',
      missingFields,
    });
  }
}
