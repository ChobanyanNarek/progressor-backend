import { Column, Entity, Index } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity.ts';
import { UseDto } from '../../../decorators/use-dto.decorator.ts';
import { PmTrackerDocDto } from '../dtos/pm-tracker-doc.dto.ts';
import { revisionColumn } from './revision.transformer.ts';

/**
 * One settings section of a user's data -- developers, projects, jiraConnections,
 * schedule, ... -- stored as its own record with its own revision (ADR-0018), so two tabs
 * editing different sections never overwrite each other. Tasks have their own table.
 */
@Entity({ name: 'pm_tracker_doc' })
@Index('IDX_pm_tracker_doc_user_key', ['userId', 'key'], { unique: true })
@UseDto(PmTrackerDocDto)
export class PmTrackerDocEntity extends AbstractEntity<PmTrackerDocDto> {
  @Column({ type: 'uuid' })
  userId!: Uuid;

  @Column({ type: 'varchar', length: 64 })
  key!: string;

  @Column({ type: 'jsonb', nullable: true })
  data!: unknown;

  @Column(revisionColumn)
  revision!: number;
}
