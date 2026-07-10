import { BaseDto } from '../../../common/dto/base.dto.ts';
import { AccountStatus } from '../../../constants/account-status.ts';
import { RoleType } from '../../../constants/role-type.ts';
import {
  BooleanField,
  EmailField,
  EnumField,
  NumberField,
  StringField,
  StringFieldOptional,
  UUIDField,
} from '../../../decorators/field.decorators.ts';

export class AdminPmTrackerUserDto extends BaseDto {
  @UUIDField()
  id!: Uuid;

  @StringField()
  firstName!: string;

  @StringField()
  lastName!: string;

  @EmailField()
  email!: string;

  @StringFieldOptional({ nullable: true })
  phone?: string | null;

  @EnumField(() => RoleType)
  role!: RoleType;

  @EnumField(() => AccountStatus)
  status!: AccountStatus;

  @NumberField({ int: true, min: 0 })
  devCount!: number;

  @NumberField({ int: true, min: 0 })
  projectCount!: number;

  @BooleanField()
  jiraConnected!: boolean;

  @BooleanField()
  gitlabConnected!: boolean;

  @BooleanField()
  githubConnected!: boolean;
}
