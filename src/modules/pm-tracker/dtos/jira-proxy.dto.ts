import { Expose } from 'class-transformer';

import { BaseDto } from '../../../common/dto/base.dto.ts';
import { NumberField, StringField, StringFieldOptional } from '../../../decorators/field.decorators.ts';

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

export class JiraBoardIssuesRequestDto extends BaseDto {
  @StringField()
  baseUrl!: string;

  @StringField()
  email!: string;

  @StringField()
  token!: string;

  @NumberField()
  boardId!: number;

  @StringField()
  assigneeEmail!: string;
}
