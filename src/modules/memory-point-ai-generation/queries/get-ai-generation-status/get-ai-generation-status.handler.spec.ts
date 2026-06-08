import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { AiGenerationStatus } from '../../../../constants/ai-generation-status.ts';
import { GetMemoryPointQuery } from '../../../memory-points/queries/get-memory-point/get-memory-point.query.ts';
import { GetAiGenerationStatusHandler } from './get-ai-generation-status.handler.ts';
import { GetAiGenerationStatusQuery } from './get-ai-generation-status.query.ts';

interface FakeGeneration {
  status: AiGenerationStatus;
}

describe('GetAiGenerationStatusHandler', () => {
  const memoryPointId = 'point-1' as Uuid;
  const userId = 'user-1' as Uuid;

  let handler: GetAiGenerationStatusHandler;
  let queryBusExecute: jest.Mock<(query: unknown) => Promise<unknown>>;
  let getOne: jest.Mock<() => Promise<FakeGeneration | null>>;
  let repo: { createQueryBuilder: jest.Mock };

  beforeEach(() => {
    queryBusExecute = jest
      .fn<(query: unknown) => Promise<unknown>>()
      .mockResolvedValue({ id: memoryPointId });
    getOne = jest.fn<() => Promise<FakeGeneration | null>>();
    repo = {
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        getOne,
      })),
    };

    handler = new GetAiGenerationStatusHandler(
      { execute: queryBusExecute } as never,
      repo as never,
    );
  });

  it('calls GetMemoryPointQuery (authorization) first with the right args', async () => {
    getOne.mockResolvedValue(null);

    await handler.execute(
      new GetAiGenerationStatusQuery(memoryPointId, userId),
    );

    expect(queryBusExecute).toHaveBeenCalledTimes(1);
    const query = queryBusExecute.mock.calls[0]![0];
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

    expect(getOne).not.toHaveBeenCalled();
  });

  it('returns the generation status', async () => {
    getOne.mockResolvedValue({ status: AiGenerationStatus.COMPLETED });

    const result = await handler.execute(
      new GetAiGenerationStatusQuery(memoryPointId, userId),
    );

    expect(result.status).toBe(AiGenerationStatus.COMPLETED);
  });

  it('returns undefined status when no generation exists', async () => {
    getOne.mockResolvedValue(null);

    const result = await handler.execute(
      new GetAiGenerationStatusQuery(memoryPointId, userId),
    );

    expect(result.status).toBeUndefined();
  });
});
