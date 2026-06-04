import { jest } from '@jest/globals';

import { AiGenerationStatus } from '../../../../constants/ai-generation-status.ts';
import { GetMemoryPointQuery } from '../../../memory-points/queries/get-memory-point/get-memory-point.query.ts';
import { GetAiGenerationStatusQuery } from './get-ai-generation-status.query.ts';
import { GetAiGenerationStatusHandler } from './get-ai-generation-status.handler.ts';

interface FakeGeneration {
  status: AiGenerationStatus;
}

describe('GetAiGenerationStatusHandler', () => {
  const memoryPointId = 'point-1' as Uuid;
  const userId = 'user-1' as Uuid;

  let handler: GetAiGenerationStatusHandler;
  let queryBusExecute: jest.Mock;
  let findOneBy: jest.Mock;
  let repo: { findOneBy: jest.Mock };

  beforeEach(() => {
    queryBusExecute = jest
      .fn<() => Promise<unknown>>()
      .mockResolvedValue({ id: memoryPointId });
    findOneBy = jest.fn<() => Promise<FakeGeneration | null>>();
    repo = { findOneBy };

    handler = new GetAiGenerationStatusHandler(
      { execute: queryBusExecute } as never,
      repo as never,
    );
  });

  it('calls GetMemoryPointQuery (authorization) first with the right args', async () => {
    findOneBy.mockResolvedValue(null);

    await handler.execute(
      new GetAiGenerationStatusQuery(memoryPointId, userId),
    );

    expect(queryBusExecute).toHaveBeenCalledTimes(1);
    const query = queryBusExecute.mock.calls[0][0];
    expect(query).toBeInstanceOf(GetMemoryPointQuery);
    expect((query as GetMemoryPointQuery).memoryPointId).toBe(memoryPointId);
    expect((query as GetMemoryPointQuery).userId).toBe(userId);
  });

  it('propagates the rejection when authorization query rejects', async () => {
    const authError = new Error('forbidden');
    queryBusExecute.mockRejectedValue(authError);

    await expect(
      handler.execute(new GetAiGenerationStatusQuery(memoryPointId, userId)),
    ).rejects.toThrow('forbidden');

    expect(findOneBy).not.toHaveBeenCalled();
  });

  it('returns the generation status', async () => {
    findOneBy.mockResolvedValue({ status: AiGenerationStatus.COMPLETED });

    const result = await handler.execute(
      new GetAiGenerationStatusQuery(memoryPointId, userId),
    );

    expect(result.status).toBe(AiGenerationStatus.COMPLETED);
  });

  it('returns undefined status when no generation exists', async () => {
    findOneBy.mockResolvedValue(null);

    const result = await handler.execute(
      new GetAiGenerationStatusQuery(memoryPointId, userId),
    );

    expect(result.status).toBeUndefined();
  });
});
