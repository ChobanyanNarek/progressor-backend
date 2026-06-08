import { BaseDto } from '../../../common/dto/base.dto.ts';
import {
  EmailField,
  StringField,
} from '../../../decorators/field.decorators.ts';

export class InviteTeamMemberDto extends BaseDto {
  @StringField({ minLength: 3 })
  readonly firstName!: string;

  @StringField({ minLength: 3 })
  readonly lastName!: string;

  @EmailField()
  readonly email!: string;
}
