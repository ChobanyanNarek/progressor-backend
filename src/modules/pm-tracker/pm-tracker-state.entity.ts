import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '../../common/abstract.entity.ts';
import { UseDto } from '../../decorators/use-dto.decorator.ts';
import { PmTrackerStateDto } from './dtos/pm-tracker-state.dto.ts';

@Entity({ name: 'pm_tracker_state' })
@UseDto(PmTrackerStateDto)
export class PmTrackerStateEntity extends AbstractEntity<PmTrackerStateDto> {
  @Column({ type: 'varchar', nullable: true })
  workspaceKey!: string | null;

  @Column({ type: 'uuid', nullable: true })
  userId!: Uuid | null;

  @Column({ type: 'jsonb' })
  data!: Record<string, unknown>;

  /*
   * Set once the blob has been copied into per-record storage (ADR-0018). From then on
   * the records are the source of truth and this row is kept untouched as the backup.
   */
  @Column({ type: 'timestamp', nullable: true })
  migratedAt!: Date | null;
}
