import { Query } from '@nestjs/cqrs';

import type { RecordsResponse } from '../../sync-core/records-types.ts';

// The records as plain objects, for the server's own use (sync, GET /state).
export class GetRecordsQuery extends Query<RecordsResponse> {
  constructor(
    public readonly userId: Uuid,
    // Only what changed after this revision; undefined for a full snapshot.
    public readonly since?: number,
  ) {
    super();
  }
}
