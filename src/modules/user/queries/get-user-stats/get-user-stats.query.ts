import { Query } from '@nestjs/cqrs';

import type { UserStatsDto } from '../../dtos/user-stats.dto.ts';

export class GetUserStatsQuery extends Query<UserStatsDto> {}
