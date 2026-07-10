import { BaseDto } from '../../../common/dto/base.dto.ts';
import { EmailField } from '../../../decorators/field.decorators.ts';

export class SendRegistrationCodeDto extends BaseDto {
  @EmailField()
  readonly email!: string;
}
