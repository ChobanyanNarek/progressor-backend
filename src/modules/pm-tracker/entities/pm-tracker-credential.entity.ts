import { Column, Entity, Index } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity.ts';
import { UseDto } from '../../../decorators/use-dto.decorator.ts';
import { PmTrackerCredentialDto } from '../dtos/pm-tracker-credential.dto.ts';

/**
 * An integration token (Jira, GitHub, GitLab) held server-side so it never has to live
 * in the browser or in the pm_tracker_state blob. One row per user per connection; the
 * connection id is the frontend's own id for that connection.
 */
@Entity({ name: 'pm_tracker_credential' })
@Index(
  'IDX_pm_tracker_credential_user_connection',
  ['userId', 'connectionId'],
  {
    unique: true,
  },
)
@UseDto(PmTrackerCredentialDto)
export class PmTrackerCredentialEntity extends AbstractEntity<PmTrackerCredentialDto> {
  @Column({ type: 'uuid' })
  userId!: Uuid;

  @Column({ type: 'varchar' })
  connectionId!: string;

  // 'jira' | 'github' | 'gitlab'
  @Column({ type: 'varchar', length: 16 })
  provider!: string;

  // AES-256-GCM envelope from CredentialCipherService. Never returned by any endpoint.
  @Column({ type: 'text' })
  secret!: string;
}
