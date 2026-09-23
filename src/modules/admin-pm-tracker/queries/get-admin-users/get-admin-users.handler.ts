import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { PmTrackerCredentialEntity } from '../../../pm-tracker/entities/pm-tracker-credential.entity.ts';
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
    @InjectRepository(PmTrackerCredentialEntity)
    private readonly credentialRepository: Repository<PmTrackerCredentialEntity>,
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

    /*
     * Tokens now live in the credential vault, not in the state blob, so a connection
     * counts as connected when either holds its token. Ids only -- secrets are never read.
     */
    const vaulted =
      userIds.length > 0
        ? await this.credentialRepository
            .createQueryBuilder('c')
            .select(['c.userId', 'c.connectionId'])
            .where('c.user_id IN (:...userIds)', { userIds })
            .getMany()
        : [];
    const vaultedByUser = new Map<string, Set<string>>();

    for (const row of vaulted) {
      const ids = vaultedByUser.get(row.userId) ?? new Set<string>();

      ids.add(row.connectionId);
      vaultedByUser.set(row.userId, ids);
    }

    const userDtos = users.map((user) => {
      const state = stateMap.get(user.id) ?? null;
      const data = state?.data;

      const asArr = (key: string): unknown[] =>
        Array.isArray(data?.[key]) ? (data[key] as unknown[]) : [];

      const vaultedIds = vaultedByUser.get(user.id) ?? new Set<string>();
      const hasActive = (key: string): boolean =>
        (asArr(key) as Array<Record<string, unknown>>).some(
          (c) =>
            c.enabled && (Boolean(c.token) || vaultedIds.has(String(c.id))),
        );

      return AdminPmTrackerUserDto.create({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        devCount: asArr('developers').length,
        projectCount: asArr('projects').length,
        jiraConnected: hasActive('jiraConnections'),
        gitlabConnected: hasActive('gitlabConnections'),
        githubConnected: hasActive('githubConnections'),
        subscriptionActive: user.subscriptionActive,
        subscriptionUntil: user.subscriptionUntil,
        trialUntil: user.trialUntil,
      });
    });

    return AdminPmTrackerUsersDto.create({
      users: userDtos,
      total: userDtos.length,
    });
  }
}
