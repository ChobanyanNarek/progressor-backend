import { BaseDto } from '../../../common/dto/base.dto.ts';
import { ClassField } from '../../../decorators/field.decorators.ts';
import { TokenPayloadDto } from './token-payload.dto.ts';

export class LoginPayloadDto extends BaseDto {
  @ClassField(() => TokenPayloadDto)
  accessToken!: TokenPayloadDto;
}
