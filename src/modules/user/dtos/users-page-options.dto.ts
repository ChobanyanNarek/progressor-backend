import { PageOptionsDto } from '../../../common/dto/page-options.dto.ts';
import { RoleType } from '../../../constants/role-type.ts';
import { EnumFieldOptional } from '../../../decorators/field.decorators.ts';

// eslint-disable-next-line awesome-nest/dto-must-extend-abstract-or-base
export class UsersPageOptionsDto extends PageOptionsDto {
  @EnumFieldOptional(() => RoleType)
  role?: RoleType;
}
