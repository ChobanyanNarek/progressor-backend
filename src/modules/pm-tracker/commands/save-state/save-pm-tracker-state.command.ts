import { Command } from '@nestjs/cqrs';

import type { PmTrackerStateEntity } from '../../pm-tracker-state.entity.ts';

export class SavePmTrackerStateCommand extends Command<PmTrackerStateEntity> {
  constructor(
    public readonly workspaceKey: string,
    public readonly data: Record<string, unknown>,
  ) {
    super();
  }
}
