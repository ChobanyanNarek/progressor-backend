import { PageOptionsDto } from '../../../common/dto/page-options.dto.ts';
import { StringFieldOptional } from '../../../decorators/field.decorators.ts';

/**
 * Page-options for GET /pm-tracker/tasks/release-notes — filters by created
 * date range (and optionally project) instead of a free-text `q`, mirroring
 * what KanbanReleaseNotes.tsx / ScrumReleaseNotes.tsx compute client-side today.
 */
export class ReleaseNoteTasksPageOptionsDto extends PageOptionsDto {
  @StringFieldOptional()
  readonly projectId?: string;

  // YYYY-MM-DD, inclusive.
  @StringFieldOptional()
  readonly dateFrom?: string;

  // YYYY-MM-DD, inclusive.
  @StringFieldOptional()
  readonly dateTo?: string;
}
