import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { MyMemoryPointDto } from '../../dtos/my-memory-point.dto.ts';
import { GetMyMemoryPointsHandler } from './get-my-memory-points.handler.ts';
import { GetMyMemoryPointsQuery } from './get-my-memory-points.query.ts';

interface Qb {
  leftJoinAndSelect: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  paginate: jest.Mock<() => Promise<unknown>>;
}

const VALID_UUID = '0190f8e2-0000-4000-8000-000000000000' as Uuid;
const location = {
  type: 'Point' as const,
  coordinates: [44.5, 40.1] as [number, number],
};
const createdAt = new Date('2024-01-01T00:00:00.000Z');
const updatedAt = new Date('2024-01-02T00:00:00.000Z');

function makeQb(items: unknown, meta: unknown): Qb {
  const qb: Partial<Qb> = {};
  qb.leftJoinAndSelect = jest.fn().mockReturnValue(qb);
  qb.where = jest.fn().mockReturnValue(qb);
  qb.andWhere = jest.fn().mockReturnValue(qb);
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
  const meta = { meta: true };

  beforeEach(() => {
    const items = [
      {
        id: VALID_UUID,
        location,
        status: MemoryPointStatus.PENDING,
        createdAt,
        updatedAt,
        memoryPointDetails: {
          title: 'My title',
          description: 'My description',
        },
      },
    ];
    qb = makeQb(items, meta);
    createQueryBuilder = jest.fn().mockReturnValue(qb);
    handler = new GetMyMemoryPointsHandler({
      createQueryBuilder,
    } as never);
  });

  it('filters by userId, joins details and maps items to MyMemoryPointDto', async () => {
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
    expect(qb.andWhere).toHaveBeenCalledWith(
      '(mp.status != :draftStatus OR details.id IS NOT NULL)',
      { draftStatus: MemoryPointStatus.PENDING },
    );
    expect(qb.paginate).toHaveBeenCalledWith(pageOptionsDto);
    expect(result.meta).toBe(meta);
    expect(result.data[0]).toBeInstanceOf(MyMemoryPointDto);
    expect(result.data[0]).toEqual({
      id: VALID_UUID,
      location,
      status: MemoryPointStatus.PENDING,
      title: 'My title',
      description: 'My description',
      createdAt,
      updatedAt,
    });
  });

  it('leaves title and description undefined when the point has no details', async () => {
    qb.paginate.mockResolvedValue([
      [
        {
          id: VALID_UUID,
          location,
          status: MemoryPointStatus.PENDING,
          createdAt,
          updatedAt,
        },
      ],
      meta,
    ]);

    const result = await handler.execute(
      new GetMyMemoryPointsQuery(userId, {} as never),
    );

    expect(result.data[0]).toEqual({
      id: VALID_UUID,
      location,
      status: MemoryPointStatus.PENDING,
      createdAt,
      updatedAt,
    });
  });
});
