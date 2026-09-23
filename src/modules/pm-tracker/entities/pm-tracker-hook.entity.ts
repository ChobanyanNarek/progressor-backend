import { Column, Entity, Index } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity.ts';
import { UseDto } from '../../../decorators/use-dto.decorator.ts';
import { PmTrackerHookDto } from '../dtos/pm-tracker-hook.dto.ts';

/**
 * A user's webhook address for Jira, GitHub and GitLab (ADR-0019). The token is a random
 * secret; a call to it only prompts a background sync of that user.
 */
@Entity({ name: 'pm_tracker_hook' })
@Index('IDX_pm_tracker_hook_user', ['userId'], { unique: true })
@Index('IDX_pm_tracker_hook_token', ['token'], { unique: true })
@UseDto(PmTrackerHookDto)
export class PmTrackerHookEntity extends AbstractEntity<PmTrackerHookDto> {
  @Column({ type: 'uuid' })
  userId!: Uuid;

  @Column({ type: 'varchar', length: 64 })
  token!: string;
}
