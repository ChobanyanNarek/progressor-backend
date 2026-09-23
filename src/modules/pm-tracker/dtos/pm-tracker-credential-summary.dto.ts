import { BaseDto } from '../../../common/dto/base.dto.ts';
import { StringField } from '../../../decorators/field.decorators.ts';

/*
 * One stored credential as the list reports it: which connection it belongs to, never the
 * secret. A plain BaseDto rather than the entity DTO, because a list DTO rebuilds its items
 * through class-transformer, which constructs them with no entity to read from.
 */
export class PmTrackerCredentialSummaryDto extends BaseDto {
  @StringField()
  connectionId!: string;

  @StringField()
  provider!: string;
}
