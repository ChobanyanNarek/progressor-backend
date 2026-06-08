import { Command } from '@nestjs/cqrs';

/**
 * Purge PENDING memory points whose details were never submitted and that are
 * older than the configured draft TTL. Returns the number of drafts removed.
 */
export class CleanupStaleDraftsCommand extends Command<number> {}
