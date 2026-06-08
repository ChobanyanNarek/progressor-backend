import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { GetRecentMemoryPointsHandler } from './get-recent-memory-points.handler.ts';
import { GetRecentMemoryPointsQuery } from './get-recent-memory-points.query.ts';

describe('GetRecentMemoryPointsHandler', () => {
  let handler: GetRecentMemoryPointsHandler;
  let take: jest.Mock;
  let getMany: jest.Mock;

  beforeEach(() => {
    const qb: Record<string, unknown> = {};
    qb.leftJoin = jest.fn().mockReturnValue(qb);
    qb.select = jest.fn().mockReturnValue(qb);
    qb.orderBy = jest.fn().mockReturnValue(qb);
    take = jest.fn().mockReturnValue(qb);
    qb.take = take;
    getMany = jest.fn<() => Promise<unknown>>().mockResolvedValue([
      {
        id: 'a1',
        status: MemoryPointStatus.PENDING,
        createdAt: new Date('2026-01-05T00:00:00.000Z'),
        memoryPointDetails: { title: 'Grandpa' },
      },
      {
        id: 'a2',
        status: MemoryPointStatus.APPROVED,
        createdAt: new Date('2026-01-04T00:00:00.000Z'),
        memoryPointDetails: undefined,
      },
    ]);
    qb.getMany = getMany;

    handler = new GetRecentMemoryPointsHandler({
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    } as never);
  });

  it('limits to the requested count and projects title from details', async () => {
    const result = await handler.execute(new GetRecentMemoryPointsQuery(5));

    expect(take).toHaveBeenCalledWith(5);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 'a1',
      title: 'Grandpa',
      status: MemoryPointStatus.PENDING,
      createdAt: new Date('2026-01-05T00:00:00.000Z'),
    });
    // Missing details → null title, never throws.
    expect(result[1]!.title).toBeNull();
  });
});
