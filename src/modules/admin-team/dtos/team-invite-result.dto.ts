import { BaseDto } from '../../../common/dto/base.dto.ts';
import {
  EmailField,
  StringField,
  UUIDField,
} from '../../../decorators/field.decorators.ts';

export class TeamInviteResultDto extends BaseDto {
  @UUIDField()
  readonly id!: Uuid;

  @EmailField()
  readonly email!: string;

  /**
   * One-time generated password for the new admin. Returned once so the inviter
   * can relay it; not retrievable later. The invitee should change it on first
   * login.
   */
  @StringField()
  readonly tempPassword!: string;
}
