import { BaseDto } from '../../../common/dto/base.dto.ts';
import { AccountStatus } from '../../../constants/account-status.ts';
import {
  DateField,
  EmailField,
  EnumField,
  StringField,
  StringFieldOptional,
} from '../../../decorators/field.decorators.ts';

export class UserListDto extends BaseDto {
  @StringField()
  firstName!: string;

  @StringField()
  lastName!: string;

  @EmailField()
  email!: string;

  @EnumField(() => AccountStatus)
  status!: AccountStatus;

  @DateField()
  lastLogin!: Date;

  @StringFieldOptional({ nullable: true })
  avatar?: string | null;
}
