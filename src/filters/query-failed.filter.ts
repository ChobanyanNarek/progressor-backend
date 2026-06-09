import { STATUS_CODES } from 'node:http';

import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';
import { QueryFailedError } from 'typeorm';

import { LogLevel } from '../constants/log-level.ts';
import { LogSource } from '../constants/log-source.ts';
import { AdminLogsService } from '../modules/admin-logs/admin-logs.service.ts';
import { constraintErrors } from './constraint-errors.ts';

@Catch(QueryFailedError)
export class QueryFailedFilter implements ExceptionFilter<QueryFailedError> {
  /**
   * `adminLogsService` is optional so the filter still constructs without it
   * (unit tests, safety). When present, DB query failures are emitted as
   * `api`/`error` admin log entries.
   */
  constructor(
    public reflector: Reflector,
    private readonly adminLogsService?: AdminLogsService,
  ) {}

  catch(
    exception: QueryFailedError & { constraint?: string },
    host: ArgumentsHost,
  ): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception.constraint?.startsWith('UQ')
      ? HttpStatus.CONFLICT
      : HttpStatus.INTERNAL_SERVER_ERROR;

    this.adminLogsService?.record({
      level: LogLevel.ERROR,
      source: LogSource.API,
      message: 'Database query failed',
      context: { constraint: exception.constraint, status },
    });

    response.status(status).json({
      statusCode: status,
      error: STATUS_CODES[status],
      message: exception.constraint
        ? constraintErrors[exception.constraint]
        : undefined,
    });
  }
}
