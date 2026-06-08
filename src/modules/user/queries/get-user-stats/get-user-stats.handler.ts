import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { RoleType } from '../../../../constants/role-type.ts';
import { UserRoleBreakdownDto } from '../../dtos/user-role-breakdown.dto.ts';
import { UserStatsDto } from '../../dtos/user-stats.dto.ts';
import { UserEntity } from '../../user.entity.ts';
import { GetUserStatsQuery } from './get-user-stats.query.ts';

interface IRoleCountRow {
  role: RoleType;
  count: string;
}

@QueryHandler(GetUserStatsQuery)
export class GetUserStatsHandler
  implements IQueryHandler<GetUserStatsQuery, UserStatsDto>
{
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(): Promise<UserStatsDto> {
    const rows = await this.userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany<IRoleCountRow>();

    const counts: Record<RoleType, number> = {
      [RoleType.CREATOR]: 0,
      [RoleType.ADMIN]: 0,
    };

    let total = 0;

    for (const row of rows) {
      const count = Number(row.count);
      counts[row.role] = count;
      total += count;
    }

    return UserStatsDto.create({
      total,
      byRole: UserRoleBreakdownDto.create({
        creator: counts[RoleType.CREATOR],
        admin: counts[RoleType.ADMIN],
      }),
    });
  }
}
