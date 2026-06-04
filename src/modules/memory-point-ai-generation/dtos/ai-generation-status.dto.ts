import { BaseDto } from '../../../common/dto/base.dto.ts';
import { AiGenerationStatus } from '../../../constants/ai-generation-status.ts';
import { EnumFieldOptional } from '../../../decorators/field.decorators.ts';

export class AiGenerationStatusResponseDto extends BaseDto {
  @EnumFieldOptional(() => AiGenerationStatus)
  status?: AiGenerationStatus;
}
