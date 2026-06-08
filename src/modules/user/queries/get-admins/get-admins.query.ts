import { Query } from '@nestjs/cqrs';

import type { UserDto } from '../../dtos/user.dto.ts';

export class GetAdminsQuery extends Query<UserDto[]> {}
