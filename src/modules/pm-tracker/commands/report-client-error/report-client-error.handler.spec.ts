import { describe, expect, it, jest } from '@jest/globals';

import { LogLevel } from '../../../../constants/log-level.ts';
import { LogSource } from '../../../../constants/log-source.ts';
import { ReportClientErrorCommand } from './report-client-error.command.ts';
import { ReportClientErrorHandler } from './report-client-error.handler.ts';

const USER_ID = '11111111-1111-4111-8111-111111111111' as Uuid;

describe('ReportClientErrorHandler', () => {
  it('records the browser error in the admin log under the web source', async () => {
    const record = jest.fn();
    const handler = new ReportClientErrorHandler({ record } as never);

    await handler.execute(
      new ReportClientErrorCommand(
        USER_ID,
        {
          message: 'TypeError: x is undefined',
          stack: 'TypeError: x is undefined\n    at render (app.js:1:2)',
          url: 'https://www.progressor.work/',
          kind: 'render',
          release: 'abc123',
        } as never,
        'Mozilla/5.0',
      ),
    );

    expect(record).toHaveBeenCalledWith({
      level: LogLevel.ERROR,
      source: LogSource.WEB,
      message: 'TypeError: x is undefined',
      context: {
        userId: USER_ID,
        kind: 'render',
        url: 'https://www.progressor.work/',
        release: 'abc123',
        // Multi-line stacks must survive intact.
        stack: 'TypeError: x is undefined\n    at render (app.js:1:2)',
        userAgent: 'Mozilla/5.0',
      },
    });
  });

  it('fills defaults when optional fields are absent', async () => {
    const record = jest.fn();
    const handler = new ReportClientErrorHandler({ record } as never);

    await handler.execute(
      new ReportClientErrorCommand(
        USER_ID,
        { message: 'boom' } as never,
        undefined,
      ),
    );

    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'boom',
        context: expect.objectContaining({ kind: 'error', stack: null }),
      }),
    );
  });
});
