import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { RoleType } from '../../constants/role-type.ts';
import { AuthUser } from '../../decorators/auth-user.decorator.ts';
import {
  ApiUUIDParam,
  Auth,
  UUIDParam,
} from '../../decorators/http.decorators.ts';
import type { UserEntity } from '../user/user.entity.ts';
import { AdminTeamService } from './admin-team.service.ts';
import { InviteTeamMemberDto } from './dtos/invite-team-member.dto.ts';
import { TeamInviteResultDto } from './dtos/team-invite-result.dto.ts';
import { TeamMemberDto } from './dtos/team-member.dto.ts';

@Controller('admin')
@ApiTags('admin-team')
export class AdminTeamController {
  constructor(private readonly teamService: AdminTeamService) {}

  @Get('settings/team')
  @Auth([RoleType.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List admin team members' })
  @ApiOkResponse({
    // eslint-disable-next-line awesome-nest/unique-endpoint-dtos
    type: TeamMemberDto,
    isArray: true,
  })
  getTeam(): Promise<TeamMemberDto[]> {
    return this.teamService.getTeam();
  }

  @Post('team/invite')
  @Auth([RoleType.ADMIN])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Invite a new admin (returns a one-time temporary password)',
  })
  @ApiCreatedResponse({
    // eslint-disable-next-line awesome-nest/unique-endpoint-dtos
    type: TeamInviteResultDto,
  })
  invite(@Body() dto: InviteTeamMemberDto): Promise<TeamInviteResultDto> {
    return this.teamService.invite(dto);
  }

  @Delete('team/:id')
  @Auth([RoleType.ADMIN])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an admin team member' })
  @ApiUUIDParam('id')
  remove(
    @UUIDParam('id') id: Uuid,
    @AuthUser() user: UserEntity,
  ): Promise<void> {
    return this.teamService.removeMember(id, user.id);
  }
}
