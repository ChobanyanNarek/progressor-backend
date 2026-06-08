import { BaseDto } from '../../../common/dto/base.dto.ts';
import {
  EmailField,
  StringField,
} from '../../../decorators/field.decorators.ts';

export class UserLoginDto extends BaseDto {
  @EmailField()
  readonly email!: string;

  @StringField()
  readonly password!: string;
}
