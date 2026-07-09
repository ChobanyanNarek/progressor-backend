import { Query } from '@nestjs/cqrs';

import type { PmTrackerStateEntity } from '../../pm-tracker-state.entity.ts';

export class GetPmTrackerStateQuery extends Query<PmTrackerStateEntity | null> {
  constructor(public readonly userId: Uuid) {
    super();
  }
}
