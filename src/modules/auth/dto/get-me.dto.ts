import { BaseDto } from '../../../common/dto/base.dto.ts';
import { RoleType } from '../../../constants/role-type.ts';
import {
  EmailField,
  EnumField,
  StringField,
  StringFieldOptional,
  UUIDField,
} from '../../../decorators/field.decorators.ts';

export class GetMeDto extends BaseDto {
  @UUIDField()
  id!: Uuid;

  @StringField()
  firstName!: string;

  @StringField()
  lastName!: string;

  @EmailField()
  email!: string;

  @EnumField(() => RoleType)
  role!: RoleType;

  @StringFieldOptional({ nullable: true })
  avatar?: string | null;
}
