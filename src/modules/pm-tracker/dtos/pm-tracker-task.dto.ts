import type { AbstractEntity } from '../../../common/abstract.entity.ts';
import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import {
  StringField,
  StringFieldOptional,
} from '../../../decorators/field.decorators.ts';

/*
 * `jiras`/`rest` intentionally carry no @Field decorator, matching
 * PmTrackerStateDto.data's precedent for opaque JSONB passthrough — the
 * existing IsObject()-based ObjectField decorators reject arrays, and this
 * payload's shape is owned by the frontend, not validated server-side.
 */

interface ITaskEntityShape {
  clientId: string;
  devId: string;
  projectId: string;
  title: string;
  status: string;
  date: string;
  comment: string | null;
  jiras: Array<Record<string, unknown>>;
  rest: Record<string, unknown>;
}

export class PmTrackerTaskDto extends AbstractDto {
  @StringField()
  clientId!: string;

  @StringField()
  devId!: string;

  @StringField()
  projectId!: string;

  @StringField()
  title!: string;

  @StringField()
  status!: string;

  @StringField()
  date!: string;

  @StringFieldOptional()
  comment!: string | null;

  jiras!: Array<Record<string, unknown>>;

  rest!: Record<string, unknown>;

  constructor(entity: AbstractEntity & ITaskEntityShape) {
    super(entity);
    this.clientId = entity.clientId;
    this.devId = entity.devId;
    this.projectId = entity.projectId;
    this.title = entity.title;
    this.status = entity.status;
    this.date = entity.date;
    this.comment = entity.comment;
    this.jiras = entity.jiras;
    this.rest = entity.rest;
  }
}
