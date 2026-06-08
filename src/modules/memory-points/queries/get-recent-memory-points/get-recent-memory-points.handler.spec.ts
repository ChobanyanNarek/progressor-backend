import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { RecentMemoryPointDto } from '../../dtos/recent-memory-point.dto.ts';
import { GetRecentMemoryPointsHandler } from './get-recent-memory-points.handler.ts';
import { GetRecentMemoryPointsQuery } from './get-recent-memory-points.query.ts';

const POINT_ID_A = '11111111-1111-4111-8111-111111111111' as Uuid;
const POINT_ID_B = '22222222-2222-4222-8222-222222222222' as Uuid;

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
        id: POINT_ID_A,
        status: MemoryPointStatus.PENDING,
        createdAt: new Date('2026-01-05T00:00:00.000Z'),
        memoryPointDetails: { title: 'Grandpa' },
      },
      {
        id: POINT_ID_B,
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
    expect(result[0]).toBeInstanceOf(RecentMemoryPointDto);
    expect(result[0]).toEqual(
      RecentMemoryPointDto.create({
        id: POINT_ID_A,
        title: 'Grandpa',
        status: MemoryPointStatus.PENDING,
        createdAt: new Date('2026-01-05T00:00:00.000Z'),
      }),
    );
    // Missing details → null title, never throws.
    expect(result[1]!.title).toBeNull();
  });
});
