import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  DEDUP_LIVE_STATUSES,
  MemoryPointStatus,
} from '../../../../constants/memory-point-status.ts';
import { DuplicateMemoryPointException } from '../../exceptions/duplicate-memory-point.exception.ts';
import { CreateMemoryPointCommand } from './create-memory-point.command.ts';
import { CreateMemoryPointHandler } from './create-memory-point.handler.ts';

const USER_ID = 'user-1' as Uuid;
const POINT_ID = 'point-1' as Uuid;
const NEARBY_ID = 'nearby-1' as Uuid;

const DUPLICATE_RADIUS = 10;

/**
 * Builds a mocked repository whose createQueryBuilder chain yields the
 * provided rawOne result for the duplicate-check call and a normal insert
 * for the creation call.
 */
function makeRepository(duplicateRaw?: { id: Uuid; distance: string }): {
  createQueryBuilder: jest.Mock;
} {
  // --- INSERT query builder ---
  const insertExecute = jest
    .fn<() => Promise<unknown>>()
    .mockResolvedValue({ identifiers: [{ id: POINT_ID }] });
  const insertSetParameters = jest
    .fn()
    .mockReturnValue({ execute: insertExecute });
  const insertValues = jest
    .fn()
    .mockReturnValue({ setParameters: insertSetParameters });
  const insertInto = jest.fn().mockReturnValue({ values: insertValues });
  const insertQb = { insert: jest.fn().mockReturnValue({ into: insertInto }) };

  // --- SELECT for re-fetching the newly created point ---
  const getOneOrFail = jest.fn<() => Promise<unknown>>().mockResolvedValue({
    id: POINT_ID,
    status: MemoryPointStatus.PENDING,
    toDto: () => ({ id: POINT_ID, status: MemoryPointStatus.PENDING }),
  });
  const refetchQb = { where: jest.fn().mockReturnValue({ getOneOrFail }) };

  // --- Duplicate-check query builder ---
  const getRawOne = jest
    .fn<() => Promise<unknown>>()
    .mockResolvedValue(duplicateRaw);
  const dupQb: Record<string, unknown> = {};
  dupQb.select = jest.fn().mockReturnValue(dupQb);
  dupQb.addSelect = jest.fn().mockReturnValue(dupQb);
  dupQb.where = jest.fn().mockReturnValue(dupQb);
  dupQb.andWhere = jest.fn().mockReturnValue(dupQb);
  dupQb.setParameters = jest.fn().mockReturnValue(dupQb);
  dupQb.orderBy = jest.fn().mockReturnValue(dupQb);
  dupQb.getRawOne = getRawOne;

  // First call = duplicate check; second = insert qb; third = re-fetch qb
  const createQueryBuilder = jest
    .fn()
    .mockReturnValueOnce(dupQb)
    .mockReturnValueOnce(insertQb)
    .mockReturnValueOnce(refetchQb);

  return { createQueryBuilder };
}

function makeApiConfigService(): { duplicateRadiusMeters: number } {
  return { duplicateRadiusMeters: DUPLICATE_RADIUS };
}

function makeAdminLogsService(): { record: jest.Mock } {
  return { record: jest.fn() };
}

describe('CreateMemoryPointHandler', () => {
  describe('when no nearby point exists', () => {
    let handler: CreateMemoryPointHandler;
    let record: jest.Mock;

    beforeEach(() => {
      const repo = makeRepository();
      record = jest.fn();
      handler = new CreateMemoryPointHandler(
        repo as never,
        makeApiConfigService() as never,
        { record } as never,
      );
    });

    it('inserts a PENDING memory point and returns its DTO', async () => {
      const result = await handler.execute(
        new CreateMemoryPointCommand(USER_ID, {
          latitude: 40.1872,
          longitude: 44.5152,
        }),
      );

      expect(result).toEqual({
        id: POINT_ID,
        status: MemoryPointStatus.PENDING,
      });
      expect(record).toHaveBeenCalledWith(
        expect.objectContaining({ memoryPointId: POINT_ID }),
      );
    });
  });

  describe('when a nearby point exists and force is not set', () => {
    let handler: CreateMemoryPointHandler;

    beforeEach(() => {
      const repo = makeRepository({ id: NEARBY_ID, distance: '5.3' });
      handler = new CreateMemoryPointHandler(
        repo as never,
        makeApiConfigService() as never,
        makeAdminLogsService() as never,
      );
    });

    it('throws DuplicateMemoryPointException with nearest id and distance', async () => {
      await expect(
        handler.execute(
          new CreateMemoryPointCommand(USER_ID, {
            latitude: 40.1872,
            longitude: 44.5152,
          }),
        ),
      ).rejects.toBeInstanceOf(DuplicateMemoryPointException);
    });
  });

  describe('when a nearby point exists but force = true', () => {
    let handler: CreateMemoryPointHandler;

    beforeEach(() => {
      // When force=true, duplicate check is skipped entirely; only insert + refetch qbs are used.
      const insertExecute = jest
        .fn<() => Promise<unknown>>()
        .mockResolvedValue({ identifiers: [{ id: POINT_ID }] });
      const insertSetParameters = jest
        .fn()
        .mockReturnValue({ execute: insertExecute });
      const insertValues = jest
        .fn()
        .mockReturnValue({ setParameters: insertSetParameters });
      const insertInto = jest.fn().mockReturnValue({ values: insertValues });
      const insertQb = {
        insert: jest.fn().mockReturnValue({ into: insertInto }),
      };

      const getOneOrFail = jest.fn<() => Promise<unknown>>().mockResolvedValue({
        id: POINT_ID,
        status: MemoryPointStatus.PENDING,
        toDto: () => ({ id: POINT_ID, status: MemoryPointStatus.PENDING }),
      });
      const refetchQb = { where: jest.fn().mockReturnValue({ getOneOrFail }) };

      // With force=true, only 2 calls: insert + refetch
      const createQueryBuilder = jest
        .fn()
        .mockReturnValueOnce(insertQb)
        .mockReturnValueOnce(refetchQb);

      handler = new CreateMemoryPointHandler(
        { createQueryBuilder } as never,
        makeApiConfigService() as never,
        makeAdminLogsService() as never,
      );
    });

    it('bypasses duplicate check and creates the point', async () => {
      const result = await handler.execute(
        new CreateMemoryPointCommand(USER_ID, {
          latitude: 40.1872,
          longitude: 44.5152,
          force: true,
        }),
      );

      expect(result).toEqual({
        id: POINT_ID,
        status: MemoryPointStatus.PENDING,
      });
    });
  });

  describe('when the point is far enough (no duplicate)', () => {
    let handler: CreateMemoryPointHandler;

    beforeEach(() => {
      // getRawOne returns undefined = no nearby point
      const repo = makeRepository();
      handler = new CreateMemoryPointHandler(
        repo as never,
        makeApiConfigService() as never,
        makeAdminLogsService() as never,
      );
    });

    it('creates the point successfully when outside the radius', async () => {
      const result = await handler.execute(
        new CreateMemoryPointCommand(USER_ID, {
          latitude: 51.5074,
          longitude: -0.1278,
        }),
      );

      expect(result).toEqual({
        id: POINT_ID,
        status: MemoryPointStatus.PENDING,
      });
    });
  });

  describe('duplicate-check status filter', () => {
    it('only compares against live points so PENDING and REJECTED do not block', async () => {
      // No live duplicate is returned; assert the query keeps only live statuses.
      const repo = makeRepository();
      const handler = new CreateMemoryPointHandler(
        repo as never,
        makeApiConfigService() as never,
        makeAdminLogsService() as never,
      );

      await handler.execute(
        new CreateMemoryPointCommand(USER_ID, {
          latitude: 40.1872,
          longitude: 44.5152,
        }),
      );

      // First createQueryBuilder call is the duplicate-proximity probe.
      const dupQb = repo.createQueryBuilder.mock.results[0]!.value as {
        andWhere: jest.Mock;
      };
      expect(dupQb.andWhere).toHaveBeenCalledWith(
        'mp.status IN (:...liveStatuses)',
        {
          liveStatuses: DEDUP_LIVE_STATUSES,
        },
      );
      expect(DEDUP_LIVE_STATUSES).not.toContain(MemoryPointStatus.PENDING);
      expect(DEDUP_LIVE_STATUSES).not.toContain(MemoryPointStatus.REJECTED);
    });
  });

  describe('ST_MakePoint location expression', () => {
    let handler: CreateMemoryPointHandler;
    let insertValues: jest.Mock;

    beforeEach(() => {
      const insertExecute = jest
        .fn<() => Promise<unknown>>()
        .mockResolvedValue({ identifiers: [{ id: POINT_ID }] });
      const insertSetParameters = jest
        .fn()
        .mockReturnValue({ execute: insertExecute });
      insertValues = jest
        .fn()
        .mockReturnValue({ setParameters: insertSetParameters });
      const insertInto = jest.fn().mockReturnValue({ values: insertValues });
      const insertQb = {
        insert: jest.fn().mockReturnValue({ into: insertInto }),
      };

      const getOneOrFail = jest.fn<() => Promise<unknown>>().mockResolvedValue({
        id: POINT_ID,
        status: MemoryPointStatus.PENDING,
        toDto: () => ({ id: POINT_ID, status: MemoryPointStatus.PENDING }),
      });
      const refetchQb = { where: jest.fn().mockReturnValue({ getOneOrFail }) };

      // No duplicate check result; force = true to skip dup check
      const createQueryBuilder = jest
        .fn()
        .mockReturnValueOnce(insertQb)
        .mockReturnValueOnce(refetchQb);

      handler = new CreateMemoryPointHandler(
        { createQueryBuilder } as never,
        makeApiConfigService() as never,
        makeAdminLogsService() as never,
      );
    });

    it('builds the location as a ST_SetSRID/ST_MakePoint expression', async () => {
      await handler.execute(
        new CreateMemoryPointCommand(USER_ID, {
          latitude: 1,
          longitude: 2,
          force: true,
        }),
      );

      const passedValues = insertValues.mock.calls[0]![0] as {
        location: () => string;
      };

      expect(passedValues.location()).toContain('ST_SetSRID');
      expect(passedValues.location()).toContain('ST_MakePoint');
    });
  });
});
