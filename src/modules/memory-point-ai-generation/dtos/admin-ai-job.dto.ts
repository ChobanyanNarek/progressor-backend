import { BaseDto } from '../../../common/dto/base.dto.ts';
import { AiGenerationStatus } from '../../../constants/ai-generation-status.ts';
import {
  DateField,
  EnumField,
  NumberFieldOptional,
  StringFieldOptional,
  UUIDField,
} from '../../../decorators/field.decorators.ts';

/**
 * Flat, admin-wide view of a single AI generation row joined with its parent
 * memory point's title. Built via `.create()` (not `toDto()`) because the
 * `memoryPointTitle` is a cross-entity value pulled from `memory_point_details`,
 * so the shape does not map 1:1 to the generation entity (ADR-0016: this module
 * owns the produced Dto).
 */
export class AdminAiJobDto extends BaseDto {
  @UUIDField()
  id!: Uuid;

  @UUIDField()
  memoryPointId!: Uuid;

  @StringFieldOptional({ nullable: true })
  memoryPointTitle!: string | null;

  @EnumField(() => AiGenerationStatus)
  status!: AiGenerationStatus;

  @StringFieldOptional()
  didTalkId?: string;

  @StringFieldOptional()
  resultVideoUrl?: string;

  @StringFieldOptional()
  errorMessage?: string;

  @NumberFieldOptional()
  durationSeconds?: number;

  @NumberFieldOptional()
  attemptNumber?: number;

  @DateField()
  createdAt!: Date;

  @DateField()
  updatedAt!: Date;
}
