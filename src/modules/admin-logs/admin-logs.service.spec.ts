import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { LogLevel } from '../../constants/log-level.ts';
import { LogSource } from '../../constants/log-source.ts';
import { AdminLogsService } from './admin-logs.service.ts';
import { RecordAdminLogCommand } from './commands/record-admin-log/record-admin-log.command.ts';
import type { IAdminLogInput } from './interfaces/i-admin-log-input.ts';

describe('AdminLogsService', () => {
  let execute: jest.Mock<(command: unknown) => Promise<void>>;
  let commandBus: { execute: typeof execute };
  let queryBus: { execute: jest.Mock };
  let service: AdminLogsService;

  beforeEach(() => {
    execute = jest
      .fn<(command: unknown) => Promise<void>>()
      .mockResolvedValue();
    commandBus = { execute };
    queryBus = { execute: jest.fn() };
    service = new AdminLogsService(commandBus as never, queryBus as never);
  });

  describe('record', () => {
    const input: IAdminLogInput = {
      level: LogLevel.ERROR,
      source: LogSource.DID,
      message: 'D-ID video generation failed',
    };

    it('dispatches a RecordAdminLogCommand carrying the input', () => {
      service.record(input);

      expect(execute).toHaveBeenCalledTimes(1);
      const command = execute.mock.calls[0]![0];
      expect(command).toBeInstanceOf(RecordAdminLogCommand);
      expect((command as RecordAdminLogCommand).input).toBe(input);
    });

    it('does NOT throw when the command dispatch rejects', async () => {
      execute.mockRejectedValue(new Error('bus down'));

      expect(() => {
        service.record(input);
      }).not.toThrow();

      // Let the detached .catch() microtask settle without an unhandled rejection.
      await Promise.resolve();
      await Promise.resolve();
    });
  });
});
