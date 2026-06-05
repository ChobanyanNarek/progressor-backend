import { Query } from '@nestjs/cqrs';

/** Source media needed to start a D-ID generation for a memory point. */
export interface MemoryPointGenerationSource {
  sourcePhotoUrl: string;
  sourceAudioUrl: string;
}

export class GetMemoryPointGenerationSourceQuery extends Query<MemoryPointGenerationSource> {
  constructor(public readonly memoryPointId: Uuid) {
    super();
  }
}
