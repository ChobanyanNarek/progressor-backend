import { PageOptionsDto } from '../../../common/dto/page-options.dto.ts';
import { AccountStatus } from '../../../constants/account-status.ts';
import { RoleType } from '../../../constants/role-type.ts';
import { EnumFieldOptional } from '../../../decorators/field.decorators.ts';

export class UsersPageOptionsDto extends PageOptionsDto {
  @EnumFieldOptional(() => RoleType)
  role?: RoleType;

  @EnumFieldOptional(() => AccountStatus)
  status?: AccountStatus;
}
