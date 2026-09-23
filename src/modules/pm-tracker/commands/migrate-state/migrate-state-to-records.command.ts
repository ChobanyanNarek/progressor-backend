import { Command } from '@nestjs/cqrs';

export interface IMigrationOutcome {
  // False when the user was already migrated and nothing was done.
  migrated: boolean;
  tasks: number;
  docs: number;
  // Blob entries that could not become records; they stay in the untouched blob.
  skippedTasks: number;
}

export class MigrateStateToRecordsCommand extends Command<IMigrationOutcome> {
  constructor(public readonly userId: Uuid) {
    super();
  }
}
