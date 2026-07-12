import { BaseDto } from '../../../common/dto/base.dto.ts';
import { StringFieldOptional } from '../../../decorators/field.decorators.ts';

export class UpdateMyProfileDto extends BaseDto {
  @StringFieldOptional({ maxLength: 30, nullable: true })
  readonly phone?: string | null;
}
