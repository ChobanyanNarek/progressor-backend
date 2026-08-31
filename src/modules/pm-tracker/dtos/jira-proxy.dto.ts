import { Expose } from 'class-transformer';

import { BaseDto } from '../../../common/dto/base.dto.ts';
import {
  BooleanFieldOptional,
  NumberField,
  StringField,
  StringFieldOptional,
} from '../../../decorators/field.decorators.ts';

export class JiraSearchRequestDto extends BaseDto {
  @StringField()
  baseUrl!: string;

  @StringField()
  email!: string;

  @StringField()
  token!: string;

  @StringField()
  jql!: string;
}

export class JiraSearchResultDto extends BaseDto {
  @Expose()
  issues!: Array<Record<string, unknown>>;

  // True when a memory-safety cap cut this response short of Jira's real result count —
  // callers must NOT treat an issue's absence here as "no longer assigned" when this is set,
  // since it may simply not have fit within the cap (see pm-tracker.service.ts MAX_TOTAL /
  // MAX_KEYS / maxResults). Pruning based on a truncated response would wrongly delete
  // issues that are still genuinely assigned.
  @BooleanFieldOptional()
  truncated?: boolean;
}

export class JiraStatusesRequestDto extends BaseDto {
  @StringField()
  baseUrl!: string;

  @StringField()
  email!: string;

  @StringField()
  token!: string;
}

export class JiraBoardsRequestDto extends BaseDto {
  @StringField()
  baseUrl!: string;

  @StringField()
  email!: string;

  @StringField()
  token!: string;
}

export class JiraBoardIssuesRequestDto extends BaseDto {
  @StringField()
  baseUrl!: string;

  @StringField()
  email!: string;

  @StringField()
  token!: string;

  @NumberField()
  boardId!: number;

  @StringFieldOptional()
  assigneeEmail?: string;
}

export class JiraSprintsRequestDto extends BaseDto {
  @StringField()
  baseUrl!: string;

  @StringField()
  email!: string;

  @StringField()
  token!: string;

  @NumberField()
  boardId!: number;
}
