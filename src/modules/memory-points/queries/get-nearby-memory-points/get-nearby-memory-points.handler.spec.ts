import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { GetNearbyMemoryPointsHandler } from './get-nearby-memory-points.handler.ts';
import { GetNearbyMemoryPointsQuery } from './get-nearby-memory-points.query.ts';

interface Qb {
  leftJoinAndSelect: jest.Mock;
  addSelect: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  setParameters: jest.Mock;
  paginate: jest.Mock;
}

function makeQb(items: unknown, meta: unknown): Qb {
  const qb: Partial<Qb> = {};

  for (const m of [
    'leftJoinAndSelect',
    'addSelect',
    'where',
    'andWhere',
    'orderBy',
    'setParameters',
  ] as const) {
    qb[m] = jest.fn().mockReturnValue(qb);
  }

  qb.paginate = jest
    .fn<() => Promise<unknown>>()
    .mockResolvedValue([items, meta]);

  return qb as Qb;
}

describe('GetNearbyMemoryPointsHandler', () => {
  let handler: GetNearbyMemoryPointsHandler;
  let qb: Qb;
  let createQueryBuilder: jest.Mock;

  const sentinelPage = { data: ['nearby'] };
  const meta = { meta: true };
  let items: unknown[] & { toPageDto: jest.Mock };

  const baseOptions = {
    latitude: 40.1,
    longitude: 44.5,
    radiusMeters: 1000,
  };

  beforeEach(() => {
    items = Object.assign([], {
      toPageDto: jest.fn().mockReturnValue(sentinelPage),
    });
    qb = makeQb(items, meta);
    createQueryBuilder = jest.fn().mockReturnValue(qb);
    handler = new GetNearbyMemoryPointsHandler({
      createQueryBuilder,
    } as never);
  });

  it('filters by APPROVED status, orders by distance and passes lng/lat/radius params', async () => {
    const pageOptionsDto = { ...baseOptions } as never;

    const result = await handler.execute(
      new GetNearbyMemoryPointsQuery(pageOptionsDto),
    );

    expect(qb.leftJoinAndSelect).toHaveBeenCalledWith(
      'mp.memoryPointDetails',
      'details',
    );
    expect(qb.where).toHaveBeenCalledWith('mp.status = :status', {
      status: MemoryPointStatus.APPROVED,
    });
    expect(qb.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('ST_DWithin'),
    );
    expect(qb.orderBy).toHaveBeenCalledWith('distance', 'ASC');
    expect(qb.setParameters).toHaveBeenCalledWith({
      longitude: baseOptions.longitude,
      latitude: baseOptions.latitude,
      radius: baseOptions.radiusMeters,
    });
    expect(qb.paginate).toHaveBeenCalledWith(pageOptionsDto);
    expect(items.toPageDto).toHaveBeenCalledWith(meta);
    expect(result).toBe(sentinelPage);
  });

  it('does NOT apply the title filter when name is not provided', async () => {
    await handler.execute(
      new GetNearbyMemoryPointsQuery({ ...baseOptions } as never),
    );

    // Only the ST_DWithin andWhere should have run, not a title filter.
    const titleCall = qb.andWhere.mock.calls.find(
      (c) => c[0] === 'details.title ILIKE :name',
    );
    expect(titleCall).toBeUndefined();
  });

  it('applies the details.title ILIKE filter when name is provided', async () => {
    await handler.execute(
      new GetNearbyMemoryPointsQuery({
        ...baseOptions,
        name: 'bar',
      } as never),
    );

    expect(qb.andWhere).toHaveBeenCalledWith('details.title ILIKE :name', {
      name: '%bar%',
    });
  });
});
