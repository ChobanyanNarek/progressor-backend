import { BaseDto } from '../../../common/dto/base.dto.ts';
import { AccountStatus } from '../../../constants/account-status.ts';
import { RoleType } from '../../../constants/role-type.ts';
import {
  EmailField,
  EnumField,
  EnumFieldOptional,
  StringField,
} from '../../../decorators/field.decorators.ts';

export class CreateUserDto extends BaseDto {
  @StringField()
  readonly firstName!: string;

  @StringField()
  readonly lastName!: string;

  @EmailField()
  readonly email!: string;

  @StringField()
  readonly password!: string;

  @EnumField(() => RoleType)
  readonly role!: RoleType;

  @EnumFieldOptional(() => AccountStatus)
  readonly status?: AccountStatus;
}
