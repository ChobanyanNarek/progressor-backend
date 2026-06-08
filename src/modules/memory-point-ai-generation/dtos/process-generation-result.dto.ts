import { BaseDto } from '../../../common/dto/base.dto.ts';
import { BooleanField } from '../../../decorators/field.decorators.ts';

export class ProcessGenerationResultDto extends BaseDto {
  @BooleanField()
  processed!: boolean;
}
