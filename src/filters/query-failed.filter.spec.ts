/*
 * `promise/valid-params` false-positives on `filter.catch(exception, host)`:
 * `catch` here is the NestJS ExceptionFilter method, not `Promise.catch`. The
 * two-arg signature is correct, so the rule is disabled for this file.
 */
/* eslint-disable promise/valid-params */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ArgumentsHost } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { QueryFailedError } from 'typeorm';

import { LogLevel } from '../constants/log-level.ts';
import { LogSource } from '../constants/log-source.ts';
import { QueryFailedFilter } from './query-failed.filter.ts';

const makeException = (
  constraint?: string,
): QueryFailedError & { constraint?: string } => {
  const error = new QueryFailedError(
    'SELECT 1',
    [],
    new Error('boom'),
  ) as QueryFailedError & { constraint?: string };
  error.constraint = constraint;

  return error;
};

describe('QueryFailedFilter', () => {
  let status: jest.Mock;
  let json: jest.Mock;
  let host: ArgumentsHost;

  const reflector = {} as Reflector;

  beforeEach(() => {
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
      }),
    } as unknown as ArgumentsHost;
  });

  it('records a UQ conflict (409) at warn — a client conflict, not a server fault', () => {
    const record = jest.fn();
    const filter = new QueryFailedFilter(reflector, { record } as never);

    filter.catch(makeException('UQ_users_email'), host);

    expect(record).toHaveBeenCalledWith({
      level: LogLevel.WARN,
      source: LogSource.API,
      message: 'Database query failed',
      context: {
        constraint: 'UQ_users_email',
        status: HttpStatus.CONFLICT,
      },
    });
  });

  it('records a non-UQ 500 failure at error', () => {
    const record = jest.fn();
    const filter = new QueryFailedFilter(reflector, { record } as never);

    filter.catch(makeException('FK_posts_user'), host);

    expect(record).toHaveBeenCalledWith({
      level: LogLevel.ERROR,
      source: LogSource.API,
      message: 'Database query failed',
      context: {
        constraint: 'FK_posts_user',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      },
    });
  });

  it('still maps the response (409 for UQ) when recording a log', () => {
    const record = jest.fn();
    const filter = new QueryFailedFilter(reflector, { record } as never);

    filter.catch(makeException('UQ_users_email'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledTimes(1);
  });

  it('does NOT break catch() when no admin logs service is provided', () => {
    const filter = new QueryFailedFilter(reflector);

    expect(() => {
      filter.catch(makeException('UQ_users_email'), host);
    }).not.toThrow();

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledTimes(1);
  });
});
