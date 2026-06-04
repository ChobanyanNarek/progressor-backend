import { Query } from '@nestjs/cqrs';

import type { PageDto } from '../../../../common/dto/page.dto.ts';
import type { UserListDto } from '../../dtos/user-list.dto.ts';
import type { UsersPageOptionsDto } from '../../dtos/users-page-options.dto.ts';

export class GetUsersQuery extends Query<PageDto<UserListDto>> {
  constructor(public readonly pageOptionsDto: UsersPageOptionsDto) {
    super();
  }
}
