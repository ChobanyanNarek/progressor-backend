import { Command } from '@nestjs/cqrs';

import type { AdminLogInputDto } from '../../dtos/admin-log-input.dto.ts';

export class RecordAdminLogCommand extends Command<void> {
  constructor(public readonly input: AdminLogInputDto) {
    super();
  }
}
