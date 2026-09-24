import { Query } from '@nestjs/cqrs';

// The records response body for GET /pm-tracker/records, already serialised.
export class GetRecordsJsonQuery extends Query<string> {
  constructor(
    public readonly userId: Uuid,
    public readonly since?: number,
  ) {
    super();
  }
}
