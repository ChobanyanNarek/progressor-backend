import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { RoleType } from '../../../../constants/role-type.ts';
import { UserEntity } from '../../user.entity.ts';
import { GetUserStatsQuery, type IUserStats } from './get-user-stats.query.ts';

interface IRoleCountRow {
  role: RoleType;
  count: string;
}

@QueryHandler(GetUserStatsQuery)
export class GetUserStatsHandler
  implements IQueryHandler<GetUserStatsQuery, IUserStats>
{
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(): Promise<IUserStats> {
    const rows = await this.userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany<IRoleCountRow>();

    const byRole: Record<RoleType, number> = {
      [RoleType.CREATOR]: 0,
      [RoleType.ADMIN]: 0,
    };

    let total = 0;

    for (const row of rows) {
      const count = Number(row.count);
      byRole[row.role] = count;
      total += count;
    }

    return { total, byRole };
  }
}
