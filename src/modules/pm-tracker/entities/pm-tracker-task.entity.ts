import { Column, Entity, Index } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity.ts';
import { UseDto } from '../../../decorators/use-dto.decorator.ts';
import { PmTrackerTaskDto } from '../dtos/pm-tracker-task.dto.ts';
import { revisionColumn } from './revision.transformer.ts';

/**
 * One frontend Task. Since ADR-0018 this table is the source of truth for a
 * migrated user's tasks (written through POST /pm-tracker/records/commit, each
 * write checked against `revision`); for a user still on the pm_tracker_state
 * blob it remains the blob-derived mirror Search and Release Notes read.
 *
 * `jiras` and `rest` stay JSONB rather than being modeled column-by-column:
 * the frontend's JiraIssue shape (status history, PR entries, custom fields)
 * is deeply nested and still evolving, and `rest` catches every other Task
 * field (prs, carriedOver, deletedJiraUrls, etc.) without enumerating the
 * whole type up front. Search/filter only needs title, comment, dates, and
 * the embedded issues' name/url — all reachable via Postgres JSONB operators.
 */
/*
 * NOTE: (userId, date) accelerates the release-notes date-range query and the
 * per-user scan the search query starts from. The free-text search itself
 * (ILIKE across title/comment/jiras[].name/jiras[].url) is NOT index-accelerated
 * yet — it's a per-user sequential scan over jsonb_array_elements. Fine at
 * moderate per-user task counts; if search latency becomes a problem, add a
 * generated tsvector column + GIN index (a proper follow-up migration, not
 * bundled here since it needs real usage data to size correctly).
 */
@Entity({ name: 'pm_tracker_task' })
@Index(['userId', 'date'])
@Index('IDX_pm_tracker_task_user_revision', ['userId', 'revision'])
@Index('IDX_pm_tracker_task_user_client', ['userId', 'clientId'], {
  unique: true,
})
@UseDto(PmTrackerTaskDto)
export class PmTrackerTaskEntity extends AbstractEntity<PmTrackerTaskDto> {
  @Column({ type: 'uuid' })
  userId!: Uuid;

  // The frontend's own Task.id — stable across re-syncs, used to upsert.
  @Column({ type: 'varchar' })
  clientId!: string;

  @Column({ type: 'varchar' })
  devId!: string;

  @Column({ type: 'varchar' })
  projectId!: string;

  @Column({ type: 'varchar', default: '' })
  title!: string;

  @Column({ type: 'varchar' })
  status!: string;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'text', nullable: true })
  comment!: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  jiras!: Array<Record<string, unknown>>;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  rest!: Record<string, unknown>;

  // Stamped on every write; see ADR-0018 and records/record-mapping.ts.
  @Column(revisionColumn)
  revision!: number;
}
