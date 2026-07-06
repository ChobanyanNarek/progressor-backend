import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { ArController } from './ar.controller.ts';
import { ArService } from './ar.service.ts';
import { GetAnchorTokenHandler } from './queries/get-anchor-token/get-anchor-token.handler.ts';
import { ArcoreTokenSigner } from './services/arcore-token-signer.service.ts';

const queryHandlers = [GetAnchorTokenHandler];

@Module({
  imports: [CqrsModule],
  controllers: [ArController],
  providers: [ArService, ArcoreTokenSigner, ...queryHandlers],
})
export class ArModule {}
