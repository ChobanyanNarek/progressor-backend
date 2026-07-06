import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import type { AnchorTokenDto } from './dtos/anchor-token.dto.ts';
import { GetAnchorTokenQuery } from './queries/get-anchor-token/get-anchor-token.query.ts';

@Injectable()
export class ArService {
  constructor(private readonly queryBus: QueryBus) {}

  getAnchorToken(): Promise<AnchorTokenDto> {
    return this.queryBus.execute<GetAnchorTokenQuery, AnchorTokenDto>(
      new GetAnchorTokenQuery(),
    );
  }
}
