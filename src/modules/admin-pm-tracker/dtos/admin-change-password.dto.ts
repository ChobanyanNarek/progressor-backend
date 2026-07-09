import { BaseDto } from '../../../common/dto/base.dto.ts';
import { StringField } from '../../../decorators/field.decorators.ts';

export class AdminChangePasswordDto extends BaseDto {
  @StringField({ minLength: 6 })
  password!: string;
}
