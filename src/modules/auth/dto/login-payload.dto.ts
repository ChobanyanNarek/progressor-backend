import { BaseDto } from '../../../common/dto/base.dto.ts';
import {
  ClassField,
  ClassFieldOptional,
} from '../../../decorators/field.decorators.ts';
import { TokenPayloadDto } from './token-payload.dto.ts';

export class LoginPayloadDto extends BaseDto {
  @ClassField(() => TokenPayloadDto)
  accessToken!: TokenPayloadDto;

  /*
   * Optional so older clients (and any caller that ignores it) keep working — the
   * frontend uses it to renew the session silently instead of forcing a re-login.
   */
  @ClassFieldOptional(() => TokenPayloadDto)
  refreshToken?: TokenPayloadDto;
}
