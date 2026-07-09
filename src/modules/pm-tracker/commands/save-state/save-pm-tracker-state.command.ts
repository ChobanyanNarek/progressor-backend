import { Command } from '@nestjs/cqrs';

import type { SavePmTrackerStateDto } from '../../dtos/save-pm-tracker-state.dto.ts';

export class SavePmTrackerStateCommand extends Command<SavePmTrackerStateDto> {
  constructor(
    public readonly workspaceKey: string,
    public readonly data: Record<string, unknown>,
  ) {
    super();
  }
}
