import { Query } from '@nestjs/cqrs';

import type { AnchorTokenDto } from '../../dtos/anchor-token.dto.ts';

export class GetAnchorTokenQuery extends Query<AnchorTokenDto> {}
