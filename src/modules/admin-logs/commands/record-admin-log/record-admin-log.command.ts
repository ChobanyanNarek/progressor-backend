import { Command } from '@nestjs/cqrs';

import type { IAdminLogInput } from '../../interfaces/i-admin-log-input.ts';

export class RecordAdminLogCommand extends Command<void> {
  constructor(public readonly input: IAdminLogInput) {
    super();
  }
}
