import { BaseDto } from '../../../common/dto/base.dto.ts';
import { StringField } from '../../../decorators/field.decorators.ts';

export class ChangeMyPasswordDto extends BaseDto {
  @StringField({ minLength: 1 })
  readonly currentPassword!: string;

  @StringField({ minLength: 6 })
  readonly password!: string;
}
