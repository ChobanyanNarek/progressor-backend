import { BaseDto } from '../../../common/dto/base.dto.ts';
import { AccountStatus } from '../../../constants/account-status.ts';
import { RoleType } from '../../../constants/role-type.ts';
import {
  EmailField,
  EnumField,
  EnumFieldOptional,
  StringField,
  StringFieldOptional,
} from '../../../decorators/field.decorators.ts';

export class CreateUserDto extends BaseDto {
  @StringField({ minLength: 3 })
  readonly firstName!: string;

  @StringField({ minLength: 3 })
  readonly lastName!: string;

  @EmailField()
  readonly email!: string;

  @StringFieldOptional({ maxLength: 30 })
  readonly phone?: string;

  @StringField({ minLength: 6 })
  readonly password!: string;

  @EnumField(() => RoleType)
  readonly role!: RoleType;

  @EnumFieldOptional(() => AccountStatus)
  readonly status?: AccountStatus;
}
