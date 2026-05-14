import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import { AccountStatus } from '../../../constants/account-status.ts';
import { RoleType } from '../../../constants/role-type.ts';
import {
  EmailField,
  EnumField,
  StringField,
  StringFieldOptional,
} from '../../../decorators/field.decorators.ts';
import type { UserEntity } from '../user.entity.ts';

export class UserDto extends AbstractDto {
  @StringField({ minLength: 2 })
  firstName!: string;

  @StringField({ minLength: 2 })
  lastName!: string;

  @EnumField(() => RoleType)
  role!: RoleType;

  @EmailField()
  email!: string;

  @StringField({ minLength: 6 })
  password!: string;

  @EnumField(() => AccountStatus)
  status!: AccountStatus;

  @StringFieldOptional({ nullable: true })
  avatar?: string | null;

  constructor(user: UserEntity) {
    super(user);
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.role = user.role;
    this.email = user.email;
  }
}
