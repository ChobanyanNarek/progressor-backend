import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { PmTrackerStateEntity } from '../../../pm-tracker/pm-tracker-state.entity.ts';
import { UserEntity } from '../../../user/user.entity.ts';
import { AdminPmTrackerUserDto } from '../../dtos/admin-pm-tracker-user.dto.ts';
import { AdminPmTrackerUsersDto } from '../../dtos/admin-pm-tracker-users.dto.ts';
import { GetAdminUsersQuery } from './get-admin-users.query.ts';

@QueryHandler(GetAdminUsersQuery)
export class GetAdminUsersHandler
  implements IQueryHandler<GetAdminUsersQuery, AdminPmTrackerUsersDto>
{
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(PmTrackerStateEntity)
    private readonly stateRepository: Repository<PmTrackerStateEntity>,
  ) {}

  async execute(): Promise<AdminPmTrackerUsersDto> {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .orderBy('user.createdAt', 'DESC')
      .getMany();

    const userIds = users.map((u) => u.id);

    const states =
      userIds.length > 0
        ? await this.stateRepository
            .createQueryBuilder('state')
            .where('state.user_id IN (:...userIds)', { userIds })
            .getMany()
        : [];

    const stateMap = new Map(states.map((s) => [s.userId, s]));

    const userDtos = users.map((user) => {
      const state = stateMap.get(user.id) ?? null;
      const data = state?.data;

      const asArr = (key: string): unknown[] =>
        Array.isArray(data?.[key]) ? (data[key] as unknown[]) : [];

      const hasActive = (key: string): boolean =>
        (asArr(key) as Array<Record<string, unknown>>).some(
          (c) => c.enabled && c.token,
        );

      return AdminPmTrackerUserDto.create({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
        devCount: asArr('developers').length,
        projectCount: asArr('projects').length,
        jiraConnected: hasActive('jiraConnections'),
        gitlabConnected: hasActive('gitlabConnections'),
        githubConnected: hasActive('githubConnections'),
      });
    });

    return AdminPmTrackerUsersDto.create({
      users: userDtos,
      total: userDtos.length,
    });
  }
}
