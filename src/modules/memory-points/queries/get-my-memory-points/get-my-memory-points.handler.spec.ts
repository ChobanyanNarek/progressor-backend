import { jest } from '@jest/globals';

import { GetMyMemoryPointsHandler } from './get-my-memory-points.handler.ts';
import { GetMyMemoryPointsQuery } from './get-my-memory-points.query.ts';

interface Qb {
  leftJoinAndSelect: jest.Mock;
  where: jest.Mock;
  paginate: jest.Mock;
}

function makeQb(items: unknown, meta: unknown): Qb {
  const qb: Partial<Qb> = {};
  qb.leftJoinAndSelect = jest.fn().mockReturnValue(qb);
  qb.where = jest.fn().mockReturnValue(qb);
  qb.paginate = jest
    .fn<() => Promise<unknown>>()
    .mockResolvedValue([items, meta]);
  return qb as Qb;
}

describe('GetMyMemoryPointsHandler', () => {
  let handler: GetMyMemoryPointsHandler;
  let qb: Qb;
  let createQueryBuilder: jest.Mock;

  const userId = 'user-1' as Uuid;
  const sentinelPage = { data: ['mine'] };
  const meta = { meta: true };
  let items: unknown[] & { toPageDto: jest.Mock };

  beforeEach(() => {
    items = Object.assign([], {
      toPageDto: jest.fn().mockReturnValue(sentinelPage),
    });
    qb = makeQb(items, meta);
    createQueryBuilder = jest.fn().mockReturnValue(qb);
    handler = new GetMyMemoryPointsHandler({
      createQueryBuilder,
    } as never);
  });

  it('filters by userId, joins details and returns items.toPageDto(meta)', async () => {
    const pageOptionsDto = {} as never;

    const result = await handler.execute(
      new GetMyMemoryPointsQuery(userId, pageOptionsDto),
    );

    expect(createQueryBuilder).toHaveBeenCalledWith('mp');
    expect(qb.leftJoinAndSelect).toHaveBeenCalledWith(
      'mp.memoryPointDetails',
      'details',
    );
    expect(qb.where).toHaveBeenCalledWith('mp.userId = :userId', { userId });
    expect(qb.paginate).toHaveBeenCalledWith(pageOptionsDto);
    expect(items.toPageDto).toHaveBeenCalledWith(meta);
    expect(result).toBe(sentinelPage);
  });
});
