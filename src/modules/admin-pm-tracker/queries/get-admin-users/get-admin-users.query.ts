import { Query } from '@nestjs/cqrs';

import type { AdminPmTrackerUsersDto } from '../../dtos/admin-pm-tracker-users.dto.ts';

export class GetAdminUsersQuery extends Query<AdminPmTrackerUsersDto> {}
