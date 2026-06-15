import { UnprocessableEntityException } from '@nestjs/common';

/**
 * Raised when a creator submits memory point details with a title but no content
 * at all — i.e. none of source photo, source audio or description. A point must
 * carry at least one of those (an AR point may be text-only). Carries a stable
 * code per ADR-0015.
 */
export class MemoryPointContentRequiredException extends UnprocessableEntityException {
  constructor(error?: string) {
    super('error.memoryPointContentRequired', error);
  }
}
