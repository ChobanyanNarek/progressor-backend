import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { MemoryPointType } from '../../../../constants/memory-point-type.ts';
import type { GcsStorageService } from '../../../../shared/services/gcs-storage.service.ts';
import { AdminMemoryPointListItemDto } from '../../dtos/admin-memory-point-list-item.dto.ts';
import { CreatorSummaryDto } from '../../dtos/creator-summary.dto.ts';
import { GetAllMemoryPointsHandler } from './get-all-memory-points.handler.ts';
import { GetAllMemoryPointsQuery } from './get-all-memory-points.query.ts';

/*
 * Mirrors GcsStorageService.getSignedReadUrlOrNull: null/empty in → null out,
 * else a recognizable signed URL so tests can assert the path was signed.
 */
function makeGcs(): {
  getSignedReadUrlOrNull: jest.Mock<
    (path: string | null | undefined) => Promise<string | null>
  >;
} {
  return {
    getSignedReadUrlOrNull: jest
      .fn<(path: string | null | undefined) => Promise<string | null>>()
      .mockImplementation((path) =>
        Promise.resolve(path ? `https://signed/${path}` : null),
      ),
  };
}

interface IQb {
  leftJoinAndSelect: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  paginate: jest.Mock;
}

const VALID_UUID = '0190f8e2-0000-4000-8000-000000000000' as Uuid;
const USER_UUID = '0190f8e2-1111-4000-8000-000000000000' as Uuid;
const location = {
  type: 'Point' as const,
  coordinates: [44.5, 40.1] as [number, number],
};
const createdAt = new Date('2024-01-01T00:00:00.000Z');
const updatedAt = new Date('2024-01-02T00:00:00.000Z');
const user = {
  id: USER_UUID,
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  avatar: null,
};

function makeQb(items: unknown, meta: unknown): IQb {
  const qb: Partial<IQb> = {};
  qb.leftJoinAndSelect = jest.fn().mockReturnValue(qb);
  qb.where = jest.fn().mockReturnValue(qb);
  qb.andWhere = jest.fn().mockReturnValue(qb);
  qb.orderBy = jest.fn().mockReturnValue(qb);
  qb.paginate = jest
    .fn<() => Promise<unknown>>()
    .mockResolvedValue([items, meta]);

  return qb as IQb;
}

describe('GetAllMemoryPointsHandler', () => {
  let handler: GetAllMemoryPointsHandler;
  let qb: IQb;
  let createQueryBuilder: jest.Mock;

  const meta = { meta: true };

  beforeEach(() => {
    const items = [
      {
        id: VALID_UUID,
        userId: USER_UUID,
        location,
        status: MemoryPointStatus.ADMIN_REVIEWING,
        createdAt,
        updatedAt,
        user,
        memoryPointDetails: {
          title: 'Admin title',
          description: 'Admin description',
          type: MemoryPointType.MEMORIAL,
          sourcePhotoUrl: 'memory-points/p1/photo/a.jpg',
        },
      },
    ];
    qb = makeQb(items, meta);
    createQueryBuilder = jest.fn().mockReturnValue(qb);
    handler = new GetAllMemoryPointsHandler(
      { createQueryBuilder } as never,
      makeGcs() as unknown as GcsStorageService,
    );
  });

  it('builds the query joining details and maps items to AdminMemoryPointListItemDto', async () => {
    const pageOptionsDto = {} as never;

    const result = await handler.execute(
      new GetAllMemoryPointsQuery(pageOptionsDto),
    );

    expect(createQueryBuilder).toHaveBeenCalledWith('mp');
    expect(qb.leftJoinAndSelect).toHaveBeenCalledWith(
      'mp.memoryPointDetails',
      'details',
    );
    expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('mp.user', 'user');
    expect(qb.where).toHaveBeenCalledWith('mp.status != :draftStatus', {
      draftStatus: MemoryPointStatus.PENDING,
    });
    expect(qb.paginate).toHaveBeenCalledWith(pageOptionsDto);
    expect(result.meta).toBe(meta);
    expect(result.data[0]).toBeInstanceOf(AdminMemoryPointListItemDto);
    expect(result.data[0]).toEqual({
      id: VALID_UUID,
      userId: USER_UUID,
      location,
      status: MemoryPointStatus.ADMIN_REVIEWING,
      type: MemoryPointType.MEMORIAL,
      title: 'Admin title',
      description: 'Admin description',
      photoUrl: 'https://signed/memory-points/p1/photo/a.jpg',
      creator: CreatorSummaryDto.create({
        id: USER_UUID,
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        avatar: null,
      }),
      createdAt,
      updatedAt,
    });
  });

  it('defensively maps a row without details/user: type undefined, photoUrl null, creator null', async () => {
    const bareItems = [
      {
        id: VALID_UUID,
        userId: USER_UUID,
        location,
        status: MemoryPointStatus.ADMIN_REVIEWING,
        createdAt,
        updatedAt,
        user: null,
        memoryPointDetails: null,
      },
    ];
    const bareQb = makeQb(bareItems, meta);
    handler = new GetAllMemoryPointsHandler(
      { createQueryBuilder: jest.fn().mockReturnValue(bareQb) } as never,
      makeGcs() as unknown as GcsStorageService,
    );

    const result = await handler.execute(
      new GetAllMemoryPointsQuery({} as never),
    );

    expect(result.data[0]).toEqual({
      id: VALID_UUID,
      userId: USER_UUID,
      location,
      status: MemoryPointStatus.ADMIN_REVIEWING,
      photoUrl: null,
      creator: null,
      createdAt,
      updatedAt,
    });
  });

  it('orders by createdAt using the requested page order', async () => {
    await handler.execute(
      new GetAllMemoryPointsQuery({ order: 'DESC' } as never),
    );

    expect(qb.orderBy).toHaveBeenCalledWith('mp.createdAt', 'DESC');
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
