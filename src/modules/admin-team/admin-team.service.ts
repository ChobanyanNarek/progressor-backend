import { Injectable } from '@nestjs/common';

import { AccountStatus } from '../../constants/account-status.ts';
import { RoleType } from '../../constants/role-type.ts';
import { UserNotFoundException } from '../../exceptions/user-not-found.exception.ts';
import { GeneratorService } from '../../shared/services/generator.service.ts';
import { CreateUserDto } from '../user/dtos/create-user.dto.ts';
import { UserService } from '../user/user.service.ts';
import { InviteTeamMemberDto } from './dtos/invite-team-member.dto.ts';
import { TeamInviteResultDto } from './dtos/team-invite-result.dto.ts';
import { TeamMemberDto } from './dtos/team-member.dto.ts';
import { CannotRemoveLastAdminException } from './exceptions/cannot-remove-last-admin.exception.ts';
import { CannotRemoveSelfException } from './exceptions/cannot-remove-self.exception.ts';

@Injectable()
export class AdminTeamService {
  constructor(
    private readonly userService: UserService,
    private readonly generatorService: GeneratorService,
  ) {}

  async getTeam(): Promise<TeamMemberDto[]> {
    const admins = await this.userService.getAdmins();

    return admins.map((admin) =>
      TeamMemberDto.create({
        id: admin.id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        status: admin.status,
        avatar: admin.avatar ?? null,
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt,
      }),
    );
  }

  async invite(dto: InviteTeamMemberDto): Promise<TeamInviteResultDto> {
    const tempPassword = this.generatorService.tempPassword();

    const result = await this.userService.create(
      CreateUserDto.create({
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        password: tempPassword,
        role: RoleType.ADMIN,
        status: AccountStatus.ACTIVE,
      }),
    );

    return TeamInviteResultDto.create({
      id: result.id as Uuid,
      email: dto.email,
      tempPassword,
    });
  }

  async removeMember(memberId: Uuid, currentUserId: Uuid): Promise<void> {
    if (memberId === currentUserId) {
      throw new CannotRemoveSelfException();
    }

    const admins = await this.userService.getAdmins();
    const target = admins.find((admin) => admin.id === memberId);

    /*
     * Only ADMIN-role users are team members; anything else is "not found"
     * through this endpoint (creators are managed via the users endpoints).
     */
    if (!target) {
      throw new UserNotFoundException();
    }

    if (admins.length <= 1) {
      throw new CannotRemoveLastAdminException();
    }

    await this.userService.deleteUser(memberId);
  }
}
