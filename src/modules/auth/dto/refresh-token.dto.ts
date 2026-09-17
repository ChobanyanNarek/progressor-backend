import { BaseDto } from '../../../common/dto/base.dto.ts';
import {
  ClassField,
  StringField,
} from '../../../decorators/field.decorators.ts';
import { TokenPayloadDto } from './token-payload.dto.ts';

export class RefreshTokenDto extends BaseDto {
  @StringField()
  readonly refreshToken!: string;
}

/*
 * Mirrors LoginPayloadDto's shape but is its own class: the unique-endpoint-dtos lint
 * rule requires each endpoint to declare its own response type.
 */
export class RefreshPayloadDto extends BaseDto {
  @ClassField(() => TokenPayloadDto)
  accessToken!: TokenPayloadDto;

  @ClassField(() => TokenPayloadDto)
  refreshToken!: TokenPayloadDto;
}
