import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsObject, IsOptional } from 'class-validator';

import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import { LogLevel } from '../../../constants/log-level.ts';
import { LogSource } from '../../../constants/log-source.ts';
import {
  DateField,
  EnumField,
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

  /*
   * Structured, free-form diagnostic payload. There is no object field
   * decorator in field.decorators.ts (ADR-0012 covers scalar/enum/date fields),
   * so this composes the underlying primitives directly: `@Expose` so the field
   * survives `excludeExtraneousValues` in BaseDto.create, `@IsObject` +
   * `@IsOptional` for validation, and `@ApiPropertyOptional` for Swagger.
   */
  @ApiPropertyOptional({ type: Object, additionalProperties: true })
  @Expose()
  @IsOptional()
  @IsObject()
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
