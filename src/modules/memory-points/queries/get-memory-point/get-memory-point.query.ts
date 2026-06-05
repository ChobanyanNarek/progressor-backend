import { Query } from '@nestjs/cqrs';

import type { RoleType } from '../../../../constants/role-type.ts';
import type { MemoryPointDto } from '../../dtos/memory-point.dto.ts';

export class GetMemoryPointQuery extends Query<MemoryPointDto> {
  constructor(
    public readonly memoryPointId: Uuid,
    public readonly userId?: Uuid,
    public readonly role?: RoleType,
  ) {
    super();
  }
}
