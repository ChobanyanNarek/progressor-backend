import { BaseDto } from '../../../common/dto/base.dto.ts';
import { LogLevel } from '../../../constants/log-level.ts';
import { LogSource } from '../../../constants/log-source.ts';
import {
  DateFieldOptional,
  EnumField,
  ObjectFieldOptional,
  StringField,
  UUIDFieldOptional,
} from '../../../decorators/field.decorators.ts';

/**
 * Input contract for {@link AdminLogsService.record}. The writer is
 * fire-and-forget: callers across modules emit a structured diagnostic entry
 * without awaiting persistence. Modelled as a DTO (not an interface) so the
 * shape is self-documenting and validated (ADR-0008 / ADR-0016).
 */
export class AdminLogInputDto extends BaseDto {
  @EnumField(() => LogLevel)
  readonly level!: LogLevel;

  @EnumField(() => LogSource)
  readonly source!: LogSource;

  @StringField()
  readonly message!: string;

  /** Optional correlation to a memory point (PRD A5/A11 point filter). */
  @UUIDFieldOptional({ nullable: true })
  readonly memoryPointId?: Uuid | null;

  /** Free-form structured payload persisted to the `jsonb` context column. */
  @ObjectFieldOptional()
  readonly context?: Record<string, unknown>;

  /** Defaults to `new Date()` in `record()` when omitted. */
  @DateFieldOptional()
  readonly timestamp?: Date;
}
