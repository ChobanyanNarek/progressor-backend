import { BaseDto } from '../../../common/dto/base.dto.ts';
import { StringField } from '../../../decorators/field.decorators.ts';

export class UserLoginDto extends BaseDto {
  @StringField()
  readonly credential!: string;

  @StringField()
  readonly password!: string;
}
