import { Command } from '@nestjs/cqrs';

import type { PublicationState } from '../../../../constants/publication-state.ts';

export class UpdatePublicationStateCommand extends Command<void> {
  constructor(
    public readonly memoryPointId: Uuid,
    public readonly publicationState: PublicationState,
  ) {
    super();
  }
}
