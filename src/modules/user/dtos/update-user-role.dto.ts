import { BaseDto } from '../../../common/dto/base.dto.ts';
import { RoleType } from '../../../constants/role-type.ts';
import { EnumField } from '../../../decorators/field.decorators.ts';

export class UpdateUserRoleDto extends BaseDto {
  @EnumField(() => RoleType)
  readonly role!: RoleType;
}
