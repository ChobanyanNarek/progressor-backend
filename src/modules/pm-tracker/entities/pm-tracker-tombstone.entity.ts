import { Column, Entity, Index } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity.ts';
import { UseDto } from '../../../decorators/use-dto.decorator.ts';
import { PmTrackerTombstoneDto } from '../dtos/pm-tracker-tombstone.dto.ts';
import { revisionColumn } from './revision.transformer.ts';

/**
 * Marks a deleted task, so other tabs and devices asking "what changed since revision N"
 * learn that it is gone. Removed again if a task with the same id is written later.
 */
@Entity({ name: 'pm_tracker_tombstone' })
@Index('IDX_pm_tracker_tombstone_user_record', ['userId', 'recordId'], {
  unique: true,
})
@Index('IDX_pm_tracker_tombstone_user_revision', ['userId', 'revision'])
@UseDto(PmTrackerTombstoneDto)
export class PmTrackerTombstoneEntity extends AbstractEntity<PmTrackerTombstoneDto> {
  @Column({ type: 'uuid' })
  userId!: Uuid;

  // The task's client id.
  @Column({ type: 'varchar' })
  recordId!: string;

  @Column(revisionColumn)
  revision!: number;
}
