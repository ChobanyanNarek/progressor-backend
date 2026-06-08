import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { NearbyMemoryPointDto } from '../../dtos/nearby-memory-point.dto.ts';
import { GetNearbyMemoryPointsHandler } from './get-nearby-memory-points.handler.ts';
import { GetNearbyMemoryPointsQuery } from './get-nearby-memory-points.query.ts';

const VALID_UUID = '0190f8e2-0000-4000-8000-000000000000' as Uuid;
const location = {
  type: 'Point' as const,
  coordinates: [44.5, 40.1] as [number, number],
};
const createdAt = new Date('2024-01-01T00:00:00.000Z');
const updatedAt = new Date('2024-01-02T00:00:00.000Z');

interface IQb {
  leftJoinAndSelect: jest.Mock;
  addSelect: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  setParameters: jest.Mock;
  paginate: jest.Mock;
}

function makeQb(items: unknown, meta: unknown): IQb {
  const qb: Partial<IQb> = {};

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

  return qb as IQb;
}

describe('GetNearbyMemoryPointsHandler', () => {
  let handler: GetNearbyMemoryPointsHandler;
  let qb: IQb;
  let createQueryBuilder: jest.Mock;

  const meta = { meta: true };

  const baseOptions = {
    latitude: 40.1,
    longitude: 44.5,
    radiusMeters: 1000,
  };

  beforeEach(() => {
    const items = [
      {
        id: VALID_UUID,
        location,
        status: MemoryPointStatus.APPROVED,
        createdAt,
        updatedAt,
        memoryPointDetails: {
          title: 'Nearby title',
          description: 'Nearby description',
        },
      },
    ];
    qb = makeQb(items, meta);
    createQueryBuilder = jest.fn().mockReturnValue(qb);
    handler = new GetNearbyMemoryPointsHandler({
      createQueryBuilder,
    } as never);
  });

  it('filters by APPROVED status, orders by distance, passes params and maps items to NearbyMemoryPointDto', async () => {
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
    expect(result.meta).toBe(meta);
    expect(result.data[0]).toBeInstanceOf(NearbyMemoryPointDto);
    expect(result.data[0]).toEqual({
      id: VALID_UUID,
      location,
      status: MemoryPointStatus.APPROVED,
      title: 'Nearby title',
      description: 'Nearby description',
      createdAt,
      updatedAt,
    });
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
