import { Query } from '@nestjs/cqrs';

import type { PageDto } from '../../../common/dto/page.dto.ts';
import type { UserDto } from '../dtos/user.dto.ts';
import type { UsersPageOptionsDto } from '../dtos/users-page-options.dto.ts';

export class GetUsersQuery extends Query<PageDto<UserDto>> {
  constructor(public readonly pageOptionsDto: UsersPageOptionsDto) {
    super();
  }
}
