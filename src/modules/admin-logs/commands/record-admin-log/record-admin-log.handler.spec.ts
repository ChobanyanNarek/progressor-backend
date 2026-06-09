import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { LogLevel } from '../../../../constants/log-level.ts';
import { LogSource } from '../../../../constants/log-source.ts';
import type { IAdminLogInput } from '../../interfaces/i-admin-log-input.ts';
import { RecordAdminLogCommand } from './record-admin-log.command.ts';

/*
 * The handler is decorated with @Transactional({ REQUIRES_NEW }), which needs an
 * initialized transactional context absent in a plain unit test. Stub the module
 * to a no-op decorator (and a Propagation placeholder) so the handler logic runs
 * directly.
 */
const noopTransactionalDecorator = (): void => {
  // no-op @Transactional decorator stub for unit tests
};

jest.unstable_mockModule('typeorm-transactional', () => ({
  // biome-ignore lint/style/useNamingConvention: mocks the PascalCase typeorm-transactional exports
  Transactional: () => noopTransactionalDecorator,
  // biome-ignore lint/style/useNamingConvention: mocks the PascalCase typeorm-transactional exports
  Propagation: {},
}));

const handlerModule = await import('./record-admin-log.handler.ts');

describe('RecordAdminLogHandler', () => {
  const memoryPointId = '11111111-1111-4111-8111-111111111111' as Uuid;

  let insert: jest.Mock<(values: unknown) => Promise<void>>;
  let repo: { insert: typeof insert };
  let handler: InstanceType<typeof handlerModule.RecordAdminLogHandler>;

  beforeEach(() => {
    insert = jest.fn<(values: unknown) => Promise<void>>().mockResolvedValue();
    repo = { insert };
    handler = new handlerModule.RecordAdminLogHandler(repo as never);
  });

  const input: IAdminLogInput = {
    level: LogLevel.ERROR,
    source: LogSource.DID,
    memoryPointId,
    message: 'D-ID video generation failed',
    context: { generationId: 'gen-1', talkStatus: 'error' },
  };

  const run = (logInput: IAdminLogInput = input): Promise<void> =>
    handler.execute(new RecordAdminLogCommand(logInput));

  it('maps the input onto the entity columns and inserts once', async () => {
    const before = Date.now();
    await run();
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

  it('uses the provided timestamp when one is supplied', async () => {
    const timestamp = new Date('2026-01-03T10:00:00.000Z');

    await run({ ...input, timestamp });

    const values = insert.mock.calls[0]![0] as { timestamp: Date };
    expect(values.timestamp).toBe(timestamp);
  });

  it('null-fills memoryPointId and context when omitted', async () => {
    await run({
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

  it('propagates the rejection when the insert fails (the service swallows it)', async () => {
    const failure = new Error('db down');
    insert.mockRejectedValue(failure);

    await expect(run()).rejects.toBe(failure);
  });
});
