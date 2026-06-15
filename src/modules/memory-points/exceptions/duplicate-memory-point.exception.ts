import { ConflictException } from '@nestjs/common';

export class DuplicateMemoryPointException extends ConflictException {
  constructor(
    /** ID of the nearest existing memory point. */
    nearestId?: Uuid,
    /** Distance in metres to the nearest point (for diagnostics). */
    distanceMeters?: number,
  ) {
    super({
      message: 'error.duplicateMemoryPoint',
      nearestId,
      distanceMeters,
    });
  }
}
