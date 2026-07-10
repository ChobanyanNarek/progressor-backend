import { BaseDto } from '../../../common/dto/base.dto.ts';
import {
  EmailField,
  StringField,
  StringFieldOptional,
} from '../../../decorators/field.decorators.ts';

export class RegisterDto extends BaseDto {
  @StringField({ minLength: 1 })
  readonly firstName!: string;

  @StringField({ minLength: 1 })
  readonly lastName!: string;

  @EmailField()
  readonly email!: string;

  @StringFieldOptional({ maxLength: 30 })
  readonly phone?: string;

  @StringField({ minLength: 6 })
  readonly password!: string;
}
