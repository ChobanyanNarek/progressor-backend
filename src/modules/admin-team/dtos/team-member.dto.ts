import { BaseDto } from '../../../common/dto/base.dto.ts';
import { AccountStatus } from '../../../constants/account-status.ts';
import {
  DateField,
  EmailField,
  EnumField,
  StringField,
  StringFieldOptional,
  UUIDField,
} from '../../../decorators/field.decorators.ts';

export class TeamMemberDto extends BaseDto {
  @UUIDField()
  id!: Uuid;

  @StringField()
  firstName!: string;

  @StringField()
  lastName!: string;

  @EmailField()
  email!: string;

  @EnumField(() => AccountStatus)
  status!: AccountStatus;

  @StringFieldOptional({ nullable: true })
  avatar!: string | null;

  @DateField()
  lastLogin!: Date;

  @DateField()
  createdAt!: Date;
}
