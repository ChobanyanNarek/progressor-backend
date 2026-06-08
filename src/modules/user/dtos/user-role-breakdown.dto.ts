import { BaseDto } from '../../../common/dto/base.dto.ts';
import { NumberField } from '../../../decorators/field.decorators.ts';

/** Per-role user counts, one field per `RoleType` value. */
export class UserRoleBreakdownDto extends BaseDto {
  @NumberField({ int: true })
  creator!: number;

  @NumberField({ int: true })
  admin!: number;
}
