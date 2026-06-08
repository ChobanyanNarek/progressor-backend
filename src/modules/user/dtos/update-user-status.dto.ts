import { BaseDto } from '../../../common/dto/base.dto.ts';
import { AccountStatus } from '../../../constants/account-status.ts';
import { EnumField } from '../../../decorators/field.decorators.ts';

export class UpdateUserStatusDto extends BaseDto {
  @EnumField(() => AccountStatus)
  readonly status!: AccountStatus;
}
