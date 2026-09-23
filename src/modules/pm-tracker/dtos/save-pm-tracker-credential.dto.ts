import { BaseDto } from '../../../common/dto/base.dto.ts';
import { StringField } from '../../../decorators/field.decorators.ts';

export class SavePmTrackerCredentialDto extends BaseDto {
  // 'jira' | 'github' | 'gitlab' -- checked in the handler.
  @StringField({ maxLength: 16 })
  readonly provider!: string;

  @StringField({ maxLength: 1024 })
  readonly secret!: string;
}
