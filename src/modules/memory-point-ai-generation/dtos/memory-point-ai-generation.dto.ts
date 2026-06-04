import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import { AiGenerationStatus } from '../../../constants/ai-generation-status.ts';
import {
  EnumField,
  NumberField,
  NumberFieldOptional,
  StringFieldOptional,
  UUIDField,
} from '../../../decorators/field.decorators.ts';
import type { MemoryPointAiGenerationEntity } from '../memory-point-ai-generation.entity.ts';

export class MemoryPointAiGenerationDto extends AbstractDto {
  @UUIDField()
  memoryPointId!: Uuid;

  @StringFieldOptional()
  didTalkId?: string;

  @EnumField(() => AiGenerationStatus)
  status!: AiGenerationStatus;

  @StringFieldOptional()
  resultVideoUrl?: string;

  @StringFieldOptional()
  errorMessage?: string;

  @StringFieldOptional()
  userData?: string;

  @NumberFieldOptional()
  durationSeconds?: number;

  @NumberField()
  attemptNumber!: number;

  constructor(entity: MemoryPointAiGenerationEntity) {
    super(entity);
    this.memoryPointId = entity.memoryPointId;
    this.didTalkId = entity.didTalkId;
    this.status = entity.status;
    this.resultVideoUrl = entity.resultVideoUrl;
    this.errorMessage = entity.errorMessage;
    this.userData = entity.userData;
    this.durationSeconds = entity.durationSeconds;
    this.attemptNumber = entity.attemptNumber;
  }
}
