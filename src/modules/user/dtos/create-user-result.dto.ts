import { BaseDto } from '../../../common/dto/base.dto.ts';
import { UUIDField } from '../../../decorators/field.decorators.ts';

export class CreateUserResultDto extends BaseDto {
  @UUIDField()
  readonly id!: string;
}
