import { Query } from '@nestjs/cqrs';

import type { RoleType } from '../../../../constants/role-type.ts';

export interface IUserStats {
  total: number;
  byRole: Record<RoleType, number>;
}

export class GetUserStatsQuery extends Query<IUserStats> {}
