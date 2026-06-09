import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import { LogLevel } from '../../../constants/log-level.ts';
import { LogSource } from '../../../constants/log-source.ts';
import {
  DateField,
  EnumField,
  ObjectFieldOptional,
  StringField,
  UUIDFieldOptional,
} from '../../../decorators/field.decorators.ts';
import type { AdminLogEntryEntity } from '../admin-log-entry.entity.ts';

export class AdminLogEntryDto extends AbstractDto {
  @DateField()
  timestamp!: Date;

  @EnumField(() => LogLevel)
  level!: LogLevel;

  @EnumField(() => LogSource)
  source!: LogSource;

  @StringField()
  message!: string;

  // Optional correlation to a memory point (PRD A5/A11 point filter).
  @UUIDFieldOptional({ nullable: true })
  memoryPointId?: Uuid | null;

  // Structured, free-form diagnostic payload (shown on row expand).
  @ObjectFieldOptional()
  context?: Record<string, unknown>;

  constructor(entity: AdminLogEntryEntity) {
    super(entity);
    this.timestamp = entity.timestamp;
    this.level = entity.level;
    this.source = entity.source;
    this.message = entity.message;
    this.memoryPointId = entity.memoryPointId ?? undefined;
    this.context = entity.context ?? undefined;
  }
}
