import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { Auth } from '../../decorators/http.decorators.ts';
import { ArService } from './ar.service.ts';
import { AnchorTokenDto } from './dtos/anchor-token.dto.ts';

@Controller('ar')
@ApiTags('ar')
export class ArController {
  constructor(private readonly arService: ArService) {}

  @Get('anchor-token')
  /*
   * Public: logged-out mobile "viewers" have no session but still need an ARCore
   * token to resolve Cloud Anchors on-device. The token is not user-scoped (it
   * authenticates our service account to Google, same value for everyone), so
   * there is nothing user-specific to gate on. A valid bearer still yields a real
   * user; anonymous callers pass via the public strategy.
   *
   * The token is cached server-side, so minting is rare regardless of traffic;
   * the per-IP throttle is a scripted-abuse cap. ThrottlerGuard is applied here
   * explicitly because no global APP_GUARD throttler is registered.
   */
  @Auth([], { public: true })
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Mint a short-lived ARCore keyless auth token for Cloud Anchors (public; bearer optional)',
  })
  @ApiOkResponse({
    // eslint-disable-next-line awesome-nest/unique-endpoint-dtos
    type: AnchorTokenDto,
  })
  getAnchorToken(): Promise<AnchorTokenDto> {
    return this.arService.getAnchorToken();
  }
}
