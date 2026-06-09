import { PageOptionsDto } from '../../../common/dto/page-options.dto.ts';
import { AiGenerationStatus } from '../../../constants/ai-generation-status.ts';
import { EnumFieldOptional } from '../../../decorators/field.decorators.ts';

export class AdminAiJobOptionsDto extends PageOptionsDto {
  @EnumFieldOptional(() => AiGenerationStatus)
  readonly status?: AiGenerationStatus;
}
