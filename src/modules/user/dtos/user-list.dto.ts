import { BaseDto } from '../../../common/dto/base.dto.ts';
import { AccountStatus } from '../../../constants/account-status.ts';
import {
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

  @StringFieldOptional({ nullable: true })
  avatar?: string | null;
}
