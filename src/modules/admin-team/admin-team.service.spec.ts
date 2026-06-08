import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { AccountStatus } from '../../constants/account-status.ts';
import { RoleType } from '../../constants/role-type.ts';
import { UserNotFoundException } from '../../exceptions/user-not-found.exception.ts';
import type { GeneratorService } from '../../shared/services/generator.service.ts';
import type { UserService } from '../user/user.service.ts';
import { AdminTeamService } from './admin-team.service.ts';
import type { InviteTeamMemberDto } from './dtos/invite-team-member.dto.ts';
import { CannotRemoveLastAdminException } from './exceptions/cannot-remove-last-admin.exception.ts';
import { CannotRemoveSelfException } from './exceptions/cannot-remove-self.exception.ts';

const SELF_ID = '11111111-1111-4111-8111-111111111111' as Uuid;
const OTHER_ID = '22222222-2222-4222-8222-222222222222' as Uuid;

function admin(id: Uuid): Record<string, unknown> {
  return {
    id,
    firstName: 'A',
    lastName: 'B',
    email: `${id}@test.com`,
    role: RoleType.ADMIN,
    status: AccountStatus.ACTIVE,
    avatar: null,
    lastLogin: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

describe('AdminTeamService', () => {
  let service: AdminTeamService;
  let getAdmins: jest.Mock<() => Promise<unknown>>;
  let create: jest.Mock<(dto: unknown) => Promise<unknown>>;
  let deleteUser: jest.Mock<() => Promise<void>>;
  let tempPassword: jest.Mock;

  beforeEach(() => {
    getAdmins = jest
      .fn<() => Promise<unknown>>()
      .mockResolvedValue([admin(SELF_ID), admin(OTHER_ID)]);
    create = jest
      .fn<(dto: unknown) => Promise<unknown>>()
      .mockResolvedValue({ id: OTHER_ID });
    deleteUser = jest.fn<() => Promise<void>>().mockResolvedValue();
    tempPassword = jest.fn().mockReturnValue('secret-temp-pw');

    service = new AdminTeamService(
      { getAdmins, create, deleteUser } as unknown as UserService,
      { tempPassword } as unknown as GeneratorService,
    );
  });

  it('maps admins to team members', async () => {
    const team = await service.getTeam();

    expect(team).toHaveLength(2);
    expect(team[0]!.email).toContain('@test.com');
    expect(team[0]).not.toHaveProperty('password');
  });

  it('invites a new admin with a generated password and ADMIN role', async () => {
    const result = await service.invite({
      firstName: 'New',
      lastName: 'Admin',
      email: 'new@test.com',
    } as InviteTeamMemberDto);

    const createArg = create.mock.calls[0]![0] as {
      role: RoleType;
      password: string;
    };
    expect(createArg.role).toBe(RoleType.ADMIN);
    expect(createArg.password).toBe('secret-temp-pw');
    expect(result.email).toBe('new@test.com');
    expect(result.tempPassword).toBe('secret-temp-pw');
  });

  it('rejects removing yourself', async () => {
    await expect(service.removeMember(SELF_ID, SELF_ID)).rejects.toBeInstanceOf(
      CannotRemoveSelfException,
    );
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it('rejects removing a non-admin / unknown id', async () => {
    await expect(
      service.removeMember(
        '33333333-3333-4333-8333-333333333333' as Uuid,
        SELF_ID,
      ),
    ).rejects.toBeInstanceOf(UserNotFoundException);
  });

  it('rejects removing the last remaining admin', async () => {
    getAdmins.mockResolvedValue([admin(OTHER_ID)]);

    await expect(
      service.removeMember(OTHER_ID, SELF_ID),
    ).rejects.toBeInstanceOf(CannotRemoveLastAdminException);
  });

  it('removes a valid admin member', async () => {
    await service.removeMember(OTHER_ID, SELF_ID);

    expect(deleteUser).toHaveBeenCalledWith(OTHER_ID);
  });
});
