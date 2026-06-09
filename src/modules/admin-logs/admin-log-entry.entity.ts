import { Column, Entity, Index } from 'typeorm';

import { AbstractEntity } from '../../common/abstract.entity.ts';
import { LogLevel } from '../../constants/log-level.ts';
import { LogSource } from '../../constants/log-source.ts';
import { UseDto } from '../../decorators/use-dto.decorator.ts';
import { AdminLogEntryDto } from './dtos/admin-log-entry.dto.ts';

@Entity({ name: 'admin_log_entries' })
// timestamp: list default sort + from/to time-window filter.
@Index(['timestamp'])
// level: level-filtered lists.
@Index(['level'])
// source: source-filtered lists + per-source grouped counts.
@Index(['source'])
// memoryPointId: correlate logs to a point (PRD A5/A11 point filter).
@Index(['memoryPointId'])
@UseDto(AdminLogEntryDto)
export class AdminLogEntryEntity extends AbstractEntity<AdminLogEntryDto> {
  @Column({ type: 'timestamptz' })
  timestamp!: Date;

  @Column({ type: 'enum', enum: LogLevel })
  level!: LogLevel;

  @Column({ type: 'enum', enum: LogSource })
  source!: LogSource;

  @Column({ type: 'text' })
  message!: string;

  /*
   * Optional correlation to a memory point. Deliberately NO FK: logs are
   * append-only diagnostics, so a point delete must not cascade-delete its
   * history. `Uuid`-typed + `Id` suffix satisfies the field-naming lint rule.
   */
  @Column({ type: 'uuid', name: 'memory_point_id', nullable: true })
  memoryPointId?: Uuid | null;

  @Column({ type: 'jsonb', nullable: true })
  context!: Record<string, unknown> | null;
}
