import { BaseDto } from '../../../common/dto/base.dto.ts';
import { StringField } from '../../../decorators/field.decorators.ts';

export class GoogleTokenDto extends BaseDto {
  @StringField()
  readonly idToken!: string;
}
