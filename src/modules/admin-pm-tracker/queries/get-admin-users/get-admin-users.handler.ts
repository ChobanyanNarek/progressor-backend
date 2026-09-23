import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { PmTrackerCredentialEntity } from '../../../pm-tracker/entities/pm-tracker-credential.entity.ts';
import { PmTrackerStateEntity } from '../../../pm-tracker/pm-tracker-state.entity.ts';
import { UserEntity } from '../../../user/user.entity.ts';
import { AdminPmTrackerUserDto } from '../../dtos/admin-pm-tracker-user.dto.ts';
import { AdminPmTrackerUsersDto } from '../../dtos/admin-pm-tracker-users.dto.ts';
import { GetAdminUsersQuery } from './get-admin-users.query.ts';

interface IStateSummary {
  userId: string;
  devCount: number;
  projectCount: number;
  jiraConnections: unknown;
  gitlabConnections: unknown;
  githubConnections: unknown;
}

/*
 * One settings section of a user's data, wherever it lives: the records once the user
 * has moved to per-record storage (ADR-0018), the blob before. Only the sections the
 * list needs leave the database -- never the whole blob, which runs to megabytes per user.
 * Keys are constants from this file, never user input.
 */
function section(key: string): string {
  return `CASE WHEN s.migrated_at IS NULL THEN s.data->'${key}'
    ELSE (SELECT d.data FROM pm_tracker_doc d WHERE d.user_id = s.user_id AND d.key = '${key}') END`;
}

function count(key: string): string {
  return `(SELECT CASE WHEN jsonb_typeof(v) = 'array' THEN jsonb_array_length(v) ELSE 0 END
    FROM (SELECT ${section(key)} AS v) x)::int`;
}

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
        ? await this.stateRepository.manager.query<IStateSummary[]>(
            `SELECT s.user_id AS "userId",
               ${count('developers')} AS "devCount",
               ${count('projects')} AS "projectCount",
               ${section('jiraConnections')} AS "jiraConnections",
               ${section('gitlabConnections')} AS "gitlabConnections",
               ${section('githubConnections')} AS "githubConnections"
             FROM pm_tracker_state s WHERE s.user_id = ANY($1)`,
            [userIds],
          )
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
      const state = stateMap.get(user.id);

      const vaultedIds = vaultedByUser.get(user.id) ?? new Set<string>();
      const hasActive = (connections: unknown): boolean =>
        Array.isArray(connections) &&
        (connections as Array<Record<string, unknown>>).some(
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
        devCount: state?.devCount ?? 0,
        projectCount: state?.projectCount ?? 0,
        jiraConnected: hasActive(state?.jiraConnections),
        gitlabConnected: hasActive(state?.gitlabConnections),
        githubConnected: hasActive(state?.githubConnections),
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
