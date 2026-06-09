import { Command } from '@nestjs/cqrs';

/**
 * Who is repositioning the point. A discriminated union so the creator path is
 * compiler-guaranteed to carry a `userId` (admin needs none — it may move any
 * point in any status).
 */
export type LocationActor =
  | { readonly kind: 'admin' }
  | { readonly kind: 'creator'; readonly userId: Uuid };

export class UpdateMemoryPointLocationCommand extends Command<void> {
  constructor(
    public readonly memoryPointId: Uuid,
    public readonly latitude: number,
    public readonly longitude: number,
    public readonly actor: LocationActor,
  ) {
    super();
  }
}
