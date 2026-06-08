import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { UserEntity } from '../user/user.entity.ts';
import { AdminTeamController } from './admin-team.controller.ts';
import type { AdminTeamService } from './admin-team.service.ts';
import type { InviteTeamMemberDto } from './dtos/invite-team-member.dto.ts';

const SELF_ID = '11111111-1111-4111-8111-111111111111' as Uuid;
const TARGET_ID = '22222222-2222-4222-8222-222222222222' as Uuid;

describe('AdminTeamController', () => {
  let controller: AdminTeamController;
  let getTeam: jest.Mock<() => Promise<unknown>>;
  let invite: jest.Mock<() => Promise<unknown>>;
  let removeMember: jest.Mock<() => Promise<void>>;

  beforeEach(() => {
    getTeam = jest.fn<() => Promise<unknown>>().mockResolvedValue([]);
    invite = jest
      .fn<() => Promise<unknown>>()
      .mockResolvedValue({ id: TARGET_ID, email: 'new@test.com' });
    removeMember = jest.fn<() => Promise<void>>().mockResolvedValue();

    controller = new AdminTeamController({
      getTeam,
      invite,
      removeMember,
    } as unknown as AdminTeamService);
  });

  it('lists the team', async () => {
    await controller.getTeam();

    expect(getTeam).toHaveBeenCalledTimes(1);
  });

  it('delegates invite to the service', async () => {
    const dto = { email: 'new@test.com' } as InviteTeamMemberDto;

    await controller.invite(dto);

    expect(invite).toHaveBeenCalledWith(dto);
  });

  it('passes the authenticated user id to removeMember for the self guard', async () => {
    await controller.remove(TARGET_ID, { id: SELF_ID } as UserEntity);

    expect(removeMember).toHaveBeenCalledWith(TARGET_ID, SELF_ID);
  });
});
