import { jest } from '@jest/globals';

import { GetAllMemoryPointsHandler } from './get-all-memory-points.handler.ts';
import { GetAllMemoryPointsQuery } from './get-all-memory-points.query.ts';

interface Qb {
  leftJoinAndSelect: jest.Mock;
  andWhere: jest.Mock;
  paginate: jest.Mock;
}

function makeQb(items: unknown, meta: unknown): Qb {
  const qb: Partial<Qb> = {};
  qb.leftJoinAndSelect = jest.fn().mockReturnValue(qb);
  qb.andWhere = jest.fn().mockReturnValue(qb);
  qb.paginate = jest
    .fn<() => Promise<unknown>>()
    .mockResolvedValue([items, meta]);
  return qb as Qb;
}

describe('GetAllMemoryPointsHandler', () => {
  let handler: GetAllMemoryPointsHandler;
  let qb: Qb;
  let createQueryBuilder: jest.Mock;

  const sentinelPage = { data: ['page'] };
  const meta = { meta: true };
  let items: unknown[] & { toPageDto: jest.Mock };

  beforeEach(() => {
    items = Object.assign([], {
      toPageDto: jest.fn().mockReturnValue(sentinelPage),
    });
    qb = makeQb(items, meta);
    createQueryBuilder = jest.fn().mockReturnValue(qb);
    handler = new GetAllMemoryPointsHandler({
      createQueryBuilder,
    } as never);
  });

  it('builds the query joining details and returns items.toPageDto(meta)', async () => {
    const pageOptionsDto = {} as never;

    const result = await handler.execute(
      new GetAllMemoryPointsQuery(pageOptionsDto),
    );

    expect(createQueryBuilder).toHaveBeenCalledWith('mp');
    expect(qb.leftJoinAndSelect).toHaveBeenCalledWith(
      'mp.memoryPointDetails',
      'details',
    );
    expect(qb.paginate).toHaveBeenCalledWith(pageOptionsDto);
    expect(items.toPageDto).toHaveBeenCalledWith(meta);
    expect(result).toBe(sentinelPage);
  });

  it('does NOT apply the title filter when q is not set', async () => {
    await handler.execute(new GetAllMemoryPointsQuery({} as never));

    expect(qb.andWhere).not.toHaveBeenCalled();
  });

  it('applies the details.title ILIKE filter when q is set', async () => {
    const pageOptionsDto = { q: 'foo' } as never;

    await handler.execute(new GetAllMemoryPointsQuery(pageOptionsDto));

    expect(qb.andWhere).toHaveBeenCalledTimes(1);
    expect(qb.andWhere).toHaveBeenCalledWith('details.title ILIKE :name', {
      name: '%foo%',
    });
  });
});
