import { Query } from '@nestjs/cqrs';

import type { IMemoryPointGenerationFields } from '../../utils/generation-readiness.ts';

/**
 * Pure read of a memory point's generation-relevant detail fields (any may be
 * unset). Readiness validation lives in the generate command, not here.
 */
export class GetMemoryPointGenerationSourceQuery extends Query<IMemoryPointGenerationFields> {
  constructor(public readonly memoryPointId: Uuid) {
    super();
  }
}
