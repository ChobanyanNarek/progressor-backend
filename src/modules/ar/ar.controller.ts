import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { RoleType } from '../../constants/role-type.ts';
import { Auth } from '../../decorators/http.decorators.ts';
import { ArService } from './ar.service.ts';
import { AnchorTokenDto } from './dtos/anchor-token.dto.ts';

@Controller('ar')
@ApiTags('ar')
export class ArController {
  constructor(private readonly arService: ArService) {}

  @Get('anchor-token')
  @Auth([RoleType.CREATOR, RoleType.ADMIN])
  /*
   * Client needs a token ~once/hour and the result is cached server-side, so a
   * tight per-route limit is plenty. The global ThrottlerGuard is not registered
   * app-wide, so it is applied here explicitly.
   */
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mint a short-lived ARCore keyless auth token for Cloud Anchors',
  })
  @ApiOkResponse({
    // eslint-disable-next-line awesome-nest/unique-endpoint-dtos
    type: AnchorTokenDto,
  })
  getAnchorToken(): Promise<AnchorTokenDto> {
    return this.arService.getAnchorToken();
  }
}
