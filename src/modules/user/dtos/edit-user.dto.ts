import { BaseDto } from '../../../common/dto/base.dto.ts';
import { RoleType } from '../../../constants/role-type.ts';
import {
  EmailFieldOptional,
  EnumFieldOptional,
  StringFieldOptional,
} from '../../../decorators/field.decorators.ts';

export class EditUserDto extends BaseDto {
  @StringFieldOptional({ minLength: 3 })
  readonly firstName?: string;

  @StringFieldOptional({ minLength: 3 })
  readonly lastName?: string;

  @EmailFieldOptional()
  readonly email?: string;

  @EnumFieldOptional(() => RoleType)
  readonly role?: RoleType;

  @StringFieldOptional({ nullable: true })
  readonly avatar?: string | null;
}
