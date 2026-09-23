import { Query } from '@nestjs/cqrs';

import type { PmTrackerRecordsDto } from '../../dtos/pm-tracker-records.dto.ts';

export class GetRecordsQuery extends Query<PmTrackerRecordsDto> {
  constructor(
    public readonly userId: Uuid,
    // Only what changed after this revision; undefined for a full snapshot.
    public readonly since?: number,
  ) {
    super();
  }
}
