import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { BaseDto } from '../../../common/dto/base.dto.ts';
import { BooleanField } from '../../../decorators/field.decorators.ts';
import { PmTrackerCredentialSummaryDto } from './pm-tracker-credential-summary.dto.ts';

export class PmTrackerCredentialListDto extends BaseDto {
  @ApiProperty({ type: [PmTrackerCredentialSummaryDto] })
  @Expose()
  @Type(() => PmTrackerCredentialSummaryDto)
  items!: PmTrackerCredentialSummaryDto[];

  /*
   * False when the server has no encryption key configured: the client then keeps its
   * tokens locally and retries the move later.
   */
  @BooleanField()
  available!: boolean;
}
