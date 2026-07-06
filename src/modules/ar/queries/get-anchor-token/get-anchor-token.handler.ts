import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AnchorTokenDto } from '../../dtos/anchor-token.dto.ts';
import { ArcoreTokenSigner } from '../../services/arcore-token-signer.service.ts';
import { GetAnchorTokenQuery } from './get-anchor-token.query.ts';

@QueryHandler(GetAnchorTokenQuery)
export class GetAnchorTokenHandler
  implements IQueryHandler<GetAnchorTokenQuery, AnchorTokenDto>
{
  constructor(private readonly signer: ArcoreTokenSigner) {}

  execute(): Promise<AnchorTokenDto> {
    return Promise.resolve(AnchorTokenDto.create(this.signer.mint()));
  }
}
