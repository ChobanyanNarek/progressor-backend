import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Allow, ArrayMaxSize, IsObject } from 'class-validator';

import { BaseDto } from '../../../common/dto/base.dto.ts';
import {
  ClassFieldOptional,
  NumberField,
  StringField,
} from '../../../decorators/field.decorators.ts';

/*
 * One save from the client: only the records it changed, each naming the revision it
 * started from (null for a record it created). A write whose base revision is no longer
 * current is refused and reported back as a conflict, never applied over newer data.
 */

export const MAX_RECORDS_PER_COMMIT = 500;

export class PmTrackerDocWriteDto extends BaseDto {
  @StringField({ maxLength: 64 })
  readonly key!: string;

  // Any JSON value: a section is an array, an object or a scalar.
  @ApiProperty()
  @Expose()
  @Allow()
  readonly data!: unknown;

  @NumberField({ int: true, min: 0, nullable: true })
  readonly baseRevision!: number | null;
}

export class PmTrackerTaskWriteDto extends BaseDto {
  @StringField({ maxLength: 200 })
  readonly id!: string;

  @ApiProperty()
  @Expose()
  @IsObject()
  readonly data!: Record<string, unknown>;

  @NumberField({ int: true, min: 0, nullable: true })
  readonly baseRevision!: number | null;
}

export class PmTrackerTaskDeleteDto extends BaseDto {
  @StringField({ maxLength: 200 })
  readonly id!: string;

  @NumberField({ int: true, min: 0 })
  readonly baseRevision!: number;
}

export class CommitPmTrackerRecordsDto extends BaseDto {
  @ClassFieldOptional(() => PmTrackerDocWriteDto, { each: true, isArray: true })
  @ArrayMaxSize(MAX_RECORDS_PER_COMMIT)
  readonly docs?: PmTrackerDocWriteDto[];

  @ClassFieldOptional(() => PmTrackerTaskWriteDto, {
    each: true,
    isArray: true,
  })
  @ArrayMaxSize(MAX_RECORDS_PER_COMMIT)
  readonly tasks?: PmTrackerTaskWriteDto[];

  @ClassFieldOptional(() => PmTrackerTaskDeleteDto, {
    each: true,
    isArray: true,
  })
  @ArrayMaxSize(MAX_RECORDS_PER_COMMIT)
  readonly deletes?: PmTrackerTaskDeleteDto[];
}
