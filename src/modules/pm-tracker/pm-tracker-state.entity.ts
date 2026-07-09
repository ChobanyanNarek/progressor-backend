import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '../../common/abstract.entity.ts';
import { UseDto } from '../../decorators/use-dto.decorator.ts';
import { PmTrackerStateDto } from './dtos/pm-tracker-state.dto.ts';

@Entity({ name: 'pm_tracker_state' })
@UseDto(PmTrackerStateDto)
export class PmTrackerStateEntity extends AbstractEntity<PmTrackerStateDto> {
  @Column({ type: 'varchar', unique: true })
  workspaceKey!: string;

  @Column({ type: 'jsonb' })
  data!: Record<string, unknown>;
}
