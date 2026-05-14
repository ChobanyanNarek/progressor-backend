import { Query } from '@nestjs/cqrs';

import type { UserDto } from '../dtos/user.dto.ts';

export class GetUserQuery extends Query<UserDto> {
  constructor(public readonly userId: Uuid) {
    super();
  }
}
