import { BaseDto } from '../../../common/dto/base.dto.ts';
import { DateField } from '../../../decorators/field.decorators.ts';

export class UpdateUserDto extends BaseDto {
  @DateField()
  readonly lastLogin!: Date;
}
