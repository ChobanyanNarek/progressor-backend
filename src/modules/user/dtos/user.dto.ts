import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import { AccountStatus } from '../../../constants/account-status.ts';
import { RoleType } from '../../../constants/role-type.ts';
import {
  DateField,
  EmailField,
  EnumField,
  StringField,
  StringFieldOptional,
} from '../../../decorators/field.decorators.ts';
import type { UserEntity } from '../user.entity.ts';

export class UserDto extends AbstractDto {
  @StringField()
  firstName!: string;

  @StringField()
  lastName!: string;

  @EnumField(() => RoleType)
  role!: RoleType;

  @EmailField()
  email!: string;

  @StringField()
  password!: string;

  @EnumField(() => AccountStatus)
  status!: AccountStatus;

  @DateField()
  lastLogin!: Date;

  @StringFieldOptional({ nullable: true })
  avatar?: string | null;

  constructor(user: UserEntity) {
    super(user);
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.role = user.role;
    this.email = user.email;
    this.lastLogin = user.lastLogin;
    this.status = user.status;
    this.avatar = user.avatar;
  }
}
