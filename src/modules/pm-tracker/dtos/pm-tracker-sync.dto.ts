import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsArray, IsIn, IsOptional } from 'class-validator';

import { BaseDto } from '../../../common/dto/base.dto.ts';
import {
  BooleanField,
  StringField,
  StringFieldOptional,
} from '../../../decorators/field.decorators.ts';

/*
 * Server-side sync (ADR-0019). One request/response pair per endpoint (unique-endpoint-dtos).
 */

export class RunPmTrackerSyncDto extends BaseDto {
  // Only these providers; every configured one when omitted.
  @ApiProperty({
    required: false,
    isArray: true,
    enum: ['jira', 'gitlab', 'github'],
  })
  @Expose()
  @IsOptional()
  @IsArray()
  @IsIn(['jira', 'gitlab', 'github'], { each: true })
  readonly kinds?: Array<'jira' | 'gitlab' | 'github'>;

  // The browser's IANA timezone, which decides what "today" is.
  @StringFieldOptional({ maxLength: 64 })
  readonly timezone?: string;
}

export class PmTrackerSyncErrorDto extends BaseDto {
  @StringField()
  kind!: string;

  @StringField()
  message!: string;
}

export class PmTrackerSyncResultDto extends BaseDto {
  @StringField()
  startedAt!: string;

  @StringField()
  finishedAt!: string;

  // Per provider that ran, that sync's counts (e.g. jira: { added, updated, removed }).
  @ApiProperty()
  @Expose()
  results!: Record<string, unknown>;

  @ApiProperty({ type: [PmTrackerSyncErrorDto] })
  @Expose()
  @IsArray()
  errors!: PmTrackerSyncErrorDto[];
}

export class PmTrackerSyncStatusDto extends BaseDto {
  // Always true on a server that runs syncs; the web app then leaves background syncs to it.
  @BooleanField()
  serverSync!: boolean;

  @BooleanField()
  running!: boolean;

  // The last run since the server started, if any.
  @ApiProperty({ required: false, nullable: true })
  @Expose()
  lastRun!: Record<string, unknown> | null;

  // Where Jira, GitHub or GitLab can send change notifications, relative to the API.
  @StringField()
  hookPath!: string;
}

export class PmTrackerHookAckDto extends BaseDto {
  @BooleanField()
  accepted!: boolean;
}
