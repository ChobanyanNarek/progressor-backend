import { BaseDto, type Plain } from '../../../common/dto/base.dto.ts';
import {
  DateField,
  StringField,
  StringFieldOptional,
  UUIDField,
} from '../../../decorators/field.decorators.ts';
import type { PmTrackerTaskEntity } from '../entities/pm-tracker-task.entity.ts';

/**
 * Same shape as PmTrackerTaskDto — kept as its own class only because this
 * repo's lint rules (awesome-nest/unique-endpoint-dtos) require each
 * endpoint response slot to use a distinct DTO, even when two endpoints
 * return the same underlying data. Built via the static `create` factory
 * (not `new`/entity-constructor) to satisfy
 * awesome-nest/no-dto-direct-instantiation, mirroring PageDto.create's
 * precedent for a DTO that maps from an entity but isn't wired through
 * @UseDto (that's owned by PmTrackerTaskDto on the same entity).
 */
export class ReleaseNoteTaskDto extends BaseDto {
  @UUIDField()
  id!: Uuid;

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

  @DateField()
  createdAt!: Date;

  @DateField()
  updatedAt!: Date;

  static override create<TInstance extends BaseDto>(
    this: new (...args: unknown[]) => TInstance,
    data: Plain<TInstance>,
  ): TInstance;

  static override create(entity: PmTrackerTaskEntity): ReleaseNoteTaskDto;

  static override create(entity: PmTrackerTaskEntity): ReleaseNoteTaskDto {
    const dto = new ReleaseNoteTaskDto();
    dto.id = entity.id;
    dto.clientId = entity.clientId;
    dto.devId = entity.devId;
    dto.projectId = entity.projectId;
    dto.title = entity.title;
    dto.status = entity.status;
    dto.date = entity.date;
    dto.comment = entity.comment;
    dto.jiras = entity.jiras;
    dto.rest = entity.rest;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;

    return dto;
  }
}
