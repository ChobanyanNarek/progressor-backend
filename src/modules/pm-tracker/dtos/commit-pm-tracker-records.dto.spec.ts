import { describe, expect, it } from '@jest/globals';
import {
  HttpStatus,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';

import { CommitPmTrackerRecordsDto } from './commit-pm-tracker-records.dto.ts';
import { PmTrackerRecordsQueryDto } from './pm-tracker-records-query.dto.ts';

// The global pipe exactly as main.ts configures it.
const pipe = new ValidationPipe({
  whitelist: true,
  errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
  transform: true,
  dismissDefaultMessages: true,
  forbidNonWhitelisted: true,
  exceptionFactory: (errors) => new UnprocessableEntityException(errors),
});

const validate = (
  value: unknown,
  metatype: new () => unknown = CommitPmTrackerRecordsDto,
): Promise<unknown> => pipe.transform(value, { type: 'body', metatype });

describe('CommitPmTrackerRecordsDto through the global ValidationPipe', () => {
  const taskData = {
    id: 't1',
    date: '2026-09-22',
    jiras: [
      {
        issueId: 'COM-1',
        prs: [{ url: 'u', stateHistory: [] }],
        statusHistory: [{ status: 'todo' }],
      },
    ],
    carriedOver: true,
  };

  it('passes a real save through with record contents untouched', async () => {
    const body = {
      docs: [
        {
          key: 'projects',
          data: [{ id: 'p1', members: ['d1'] }],
          baseRevision: 4,
        },
        { key: 'trackerTimezone', data: null, baseRevision: null },
        { key: 'notifsEnabled', data: false, baseRevision: 2 },
      ],
      tasks: [{ id: 't1', data: taskData, baseRevision: 7 }],
      deletes: [{ id: 't0', baseRevision: 3 }],
    };

    const out = (await validate(body)) as CommitPmTrackerRecordsDto;

    // whitelist/forbidNonWhitelisted must not reach inside a record's data.
    expect(out.tasks![0]!.data).toEqual(taskData);
    expect(out.docs!.map((d) => d.data)).toEqual([
      [{ id: 'p1', members: ['d1'] }],
      null,
      false,
    ]);
    expect(out.deletes![0]!.baseRevision).toBe(3);
  });

  it('accepts a save with only some kinds of change', async () => {
    await expect(validate({ tasks: [] })).resolves.toBeDefined();
  });

  it('refuses a task write whose data is not an object', async () => {
    await expect(
      validate({ tasks: [{ id: 't1', data: 'x', baseRevision: 1 }] }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('refuses a delete without a base revision', async () => {
    await expect(validate({ deletes: [{ id: 't1' }] })).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  it('refuses more than 500 records of one kind in a save', async () => {
    const tasks = Array.from({ length: 501 }, (_, i) => ({
      id: `t${i}`,
      data: {},
      baseRevision: null,
    }));

    await expect(validate({ tasks })).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  it('reads ?since from the query string as a number', async () => {
    const out = (await pipe.transform(
      { since: '42' },
      { type: 'query', metatype: PmTrackerRecordsQueryDto },
    )) as PmTrackerRecordsQueryDto;

    expect(out.since).toBe(42);
  });
});
