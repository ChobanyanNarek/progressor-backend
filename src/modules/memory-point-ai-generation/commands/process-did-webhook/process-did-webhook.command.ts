import { Command } from '@nestjs/cqrs';

export class ProcessDidWebhookCommand extends Command<void> {
  constructor(public readonly talkId: string) {
    super();
  }
}
