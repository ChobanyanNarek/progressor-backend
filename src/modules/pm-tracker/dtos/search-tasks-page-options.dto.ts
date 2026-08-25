import { PageOptionsDto } from '../../../common/dto/page-options.dto.ts';
import { StringFieldOptional } from '../../../decorators/field.decorators.ts';

/**
 * Page-options for GET /pm-tracker/tasks/search. Inherits `q`, `order`,
 * `page`, `take` from PageOptionsDto — `q` matches against task title/comment
 * and each embedded Jira issue's name/url. `projectId`/`status` narrow further,
 * mirroring the filters SearchView.tsx already applies client-side today.
 */
export class SearchTasksPageOptionsDto extends PageOptionsDto {
  @StringFieldOptional()
  readonly projectId?: string;

  @StringFieldOptional()
  readonly status?: string;
}
