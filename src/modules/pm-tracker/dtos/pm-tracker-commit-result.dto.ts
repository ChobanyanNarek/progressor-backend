import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray } from 'class-validator';

import { BaseDto } from '../../../common/dto/base.dto.ts';
import {
  NumberField,
  NumberFieldOptional,
  StringField,
} from '../../../decorators/field.decorators.ts';

// kind: 'doc' | 'task' | 'delete'

export class PmTrackerAppliedRecordDto extends BaseDto {
  @StringField()
  kind!: string;

  @StringField()
  id!: string;

  // The record's new revision; for a delete, the tombstone's.
  @NumberField({ int: true })
  revision!: number;
}

export class PmTrackerConflictRecordDto extends BaseDto {
  @StringField()
  kind!: string;

  @StringField()
  id!: string;

  // What the server holds now; absent when the record no longer exists.
  @ApiProperty({ required: false })
  @Expose()
  data?: unknown;

  @NumberFieldOptional({ int: true })
  revision?: number;
}

export class PmTrackerRejectedRecordDto extends BaseDto {
  @StringField()
  kind!: string;

  @StringField()
  id!: string;

  // Error code, e.g. error.invalidRecord.
  @StringField()
  reason!: string;
}

export class PmTrackerCommitResultDto extends BaseDto {
  @ApiProperty({ type: [PmTrackerAppliedRecordDto] })
  @Expose()
  @IsArray()
  @Type(() => PmTrackerAppliedRecordDto)
  applied!: PmTrackerAppliedRecordDto[];

  @ApiProperty({ type: [PmTrackerConflictRecordDto] })
  @Expose()
  @IsArray()
  @Type(() => PmTrackerConflictRecordDto)
  conflicts!: PmTrackerConflictRecordDto[];

  // Writes that can never succeed as sent (a task with no usable date, a bad section name).
  @ApiProperty({ type: [PmTrackerRejectedRecordDto] })
  @Expose()
  @IsArray()
  @Type(() => PmTrackerRejectedRecordDto)
  rejected!: PmTrackerRejectedRecordDto[];
}
