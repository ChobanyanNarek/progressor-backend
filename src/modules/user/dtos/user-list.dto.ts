import { BaseDto } from '../../../common/dto/base.dto.ts';
import { AccountStatus } from '../../../constants/account-status.ts';
import { RoleType } from '../../../constants/role-type.ts';
import {
  DateField,
  EmailField,
  EnumField,
  StringField,
  StringFieldOptional,
  UUIDField,
} from '../../../decorators/field.decorators.ts';

export class UserListDto extends BaseDto {
  @UUIDField()
  id!: Uuid;

  @DateField()
  createdAt!: Date;

  @DateField()
  updatedAt!: Date;

  @StringField()
  firstName!: string;

  @StringField()
  lastName!: string;

  @EmailField()
  email!: string;

  @EnumField(() => RoleType)
  role!: RoleType;

  @EnumField(() => AccountStatus)
  status!: AccountStatus;

  @StringFieldOptional({ nullable: true })
  avatar?: string | null;

  @DateField()
  lastLogin!: Date;
}
