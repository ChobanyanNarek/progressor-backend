import { Query } from '@nestjs/cqrs';

import type { RoleType } from '../../../../constants/role-type.ts';
import type { AiGenerationStatusResponseDto } from '../../dtos/ai-generation-status.dto.ts';

export class GetAiGenerationStatusQuery extends Query<AiGenerationStatusResponseDto> {
  constructor(
    public readonly memoryPointId: Uuid,
    public readonly userId?: Uuid,
    public readonly role?: RoleType,
  ) {
    super();
  }
}
