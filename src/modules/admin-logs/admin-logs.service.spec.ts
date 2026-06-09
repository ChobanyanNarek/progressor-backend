import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { Logger } from '@nestjs/common';

import { LogLevel } from '../../constants/log-level.ts';
import { LogSource } from '../../constants/log-source.ts';
import { AdminLogsService } from './admin-logs.service.ts';
import type { IAdminLogInput } from './interfaces/i-admin-log-input.ts';

// Swallows the suppressed Logger.error output; returns void.
const noop = (): void => undefined;

describe('AdminLogsService', () => {
  const memoryPointId = '11111111-1111-4111-8111-111111111111' as Uuid;

  let insert: jest.Mock<(values: unknown) => Promise<void>>;
  let repo: { insert: typeof insert };
  let execute: jest.Mock<() => Promise<void>>;
  let queryBus: { execute: typeof execute };
  let loggerError: jest.SpiedFunction<typeof Logger.prototype.error>;
  let service: AdminLogsService;

  beforeEach(() => {
    insert = jest.fn<(values: unknown) => Promise<void>>().mockResolvedValue();
    repo = { insert };
    execute = jest.fn<() => Promise<void>>().mockResolvedValue();
    queryBus = { execute };
    /*
     * record() builds its own Logger; spy on the prototype to observe errors
     * while suppressing the real console output.
     */
    loggerError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(noop);

    service = new AdminLogsService(repo as never, queryBus as never);
  });

  afterEach(() => {
    loggerError.mockRestore();
  });

  describe('record', () => {
    const input: IAdminLogInput = {
      level: LogLevel.ERROR,
      source: LogSource.DID,
      memoryPointId,
      message: 'D-ID video generation failed',
      context: { generationId: 'gen-1', talkStatus: 'error' },
    };

    it('maps the input onto the entity columns and calls repo.insert once', () => {
      const before = Date.now();
      service.record(input);
      const after = Date.now();

      expect(insert).toHaveBeenCalledTimes(1);

      const values = insert.mock.calls[0]![0] as {
        timestamp: Date;
        level: LogLevel;
        source: LogSource;
        message: string;
        memoryPointId: Uuid | null;
        context: Record<string, unknown> | null;
      };

      expect(values.level).toBe(LogLevel.ERROR);
      expect(values.source).toBe(LogSource.DID);
      expect(values.message).toBe('D-ID video generation failed');
      expect(values.memoryPointId).toBe(memoryPointId);
      expect(values.context).toEqual({
        generationId: 'gen-1',
        talkStatus: 'error',
      });
      // timestamp defaults to "now" when the caller omits it.
      expect(values.timestamp).toBeInstanceOf(Date);
      expect(values.timestamp.getTime()).toBeGreaterThanOrEqual(before);
      expect(values.timestamp.getTime()).toBeLessThanOrEqual(after);
    });

    it('uses the provided timestamp when one is supplied', () => {
      const timestamp = new Date('2026-01-03T10:00:00.000Z');

      service.record({ ...input, timestamp });

      const values = insert.mock.calls[0]![0] as { timestamp: Date };
      expect(values.timestamp).toBe(timestamp);
    });

    it('null-fills memoryPointId and context when omitted', () => {
      service.record({
        level: LogLevel.INFO,
        source: LogSource.AUTH,
        message: 'Login succeeded',
      });

      const values = insert.mock.calls[0]![0] as {
        memoryPointId: Uuid | null;
        context: Record<string, unknown> | null;
      };
      expect(values.memoryPointId).toBeNull();
      expect(values.context).toBeNull();
    });

    it('does NOT throw when the insert rejects, and logs the failure', async () => {
      const failure = new Error('db down');
      insert.mockRejectedValue(failure);

      // Synchronous call must not throw despite the rejected insert.
      expect(() => {
        service.record(input);
      }).not.toThrow();

      // Let the detached .catch() microtask settle.
      await Promise.resolve();
      await Promise.resolve();

      expect(loggerError).toHaveBeenCalledTimes(1);
      const [message, stack] = loggerError.mock.calls[0]!;
      expect(message).toBe('Failed to persist admin log entry');
      expect(stack).toBe(failure.stack);
    });
  });
});
