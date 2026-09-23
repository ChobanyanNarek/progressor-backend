import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray } from 'class-validator';

import { BaseDto } from '../../../common/dto/base.dto.ts';
import {
  BooleanField,
  NumberField,
  StringField,
} from '../../../decorators/field.decorators.ts';

/*
 * Records as the client receives them. Plain BaseDtos rather than the entity DTOs: a list
 * DTO rebuilds its items through class-transformer, which constructs them with no entity
 * (see PmTrackerCredentialSummaryDto).
 */

export class PmTrackerDocRecordDto extends BaseDto {
  @StringField()
  key!: string;

  @ApiProperty()
  @Expose()
  data!: unknown;

  @NumberField({ int: true })
  revision!: number;
}

export class PmTrackerTaskRecordDto extends BaseDto {
  @StringField()
  id!: string;

  @ApiProperty()
  @Expose()
  data!: Record<string, unknown>;

  @NumberField({ int: true })
  revision!: number;
}

export class PmTrackerDeletedRecordDto extends BaseDto {
  @StringField()
  id!: string;

  @NumberField({ int: true })
  revision!: number;
}

export class PmTrackerRecordsDto extends BaseDto {
  // True for a complete snapshot (the client replaces its state); false for changes only.
  @BooleanField()
  full!: boolean;

  // The highest revision included; pass it back as `since` to get what changed after.
  @NumberField({ int: true })
  cursor!: number;

  @ApiProperty({ type: [PmTrackerDocRecordDto] })
  @Expose()
  @IsArray()
  @Type(() => PmTrackerDocRecordDto)
  docs!: PmTrackerDocRecordDto[];

  @ApiProperty({ type: [PmTrackerTaskRecordDto] })
  @Expose()
  @IsArray()
  @Type(() => PmTrackerTaskRecordDto)
  tasks!: PmTrackerTaskRecordDto[];

  // Tasks deleted since `since`; always empty in a full snapshot.
  @ApiProperty({ type: [PmTrackerDeletedRecordDto] })
  @Expose()
  @IsArray()
  @Type(() => PmTrackerDeletedRecordDto)
  deleted!: PmTrackerDeletedRecordDto[];
}
