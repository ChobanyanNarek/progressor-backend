import { Command } from '@nestjs/cqrs';

import type { CommitPmTrackerRecordsDto } from '../../dtos/commit-pm-tracker-records.dto.ts';
import type { PmTrackerCommitResultDto } from '../../dtos/pm-tracker-commit-result.dto.ts';

export class CommitRecordsCommand extends Command<PmTrackerCommitResultDto> {
  constructor(
    public readonly userId: Uuid,
    public readonly dto: CommitPmTrackerRecordsDto,
  ) {
    super();
  }
}
