import { BaseDto } from '../../../common/dto/base.dto.ts';
import { PhoneFieldOptional } from '../../../decorators/field.decorators.ts';

export class UpdateMyProfileDto extends BaseDto {
  @PhoneFieldOptional({ nullable: true })
  readonly phone?: string | null;
}
