import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { MemoryPointNotEditableException } from '../../exceptions/memory-point-not-editable.exception.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { UpdateMemoryPointLocationCommand } from './update-memory-point-location.command.ts';
import { UpdateMemoryPointLocationHandler } from './update-memory-point-location.handler.ts';

const POINT_ID = '11111111-1111-4111-8111-111111111111' as Uuid;
const OWNER_ID = '22222222-2222-4222-8222-222222222222' as Uuid;
const OTHER_ID = '33333333-3333-4333-8333-333333333333' as Uuid;

const LAT = 40.1872;
const LNG = 44.5152;

/** Builds an update query builder mock that tracks `execute` calls. */
function makeUpdateQb(affected: number): {
  qb: Record<string, unknown>;
  execute: jest.Mock;
} {
  const qb: Record<string, unknown> = {};
  const execute = jest
    .fn<() => Promise<unknown>>()
    .mockResolvedValue({ affected });
  qb.update = jest.fn().mockReturnValue(qb);
  qb.set = jest.fn().mockReturnValue(qb);
  qb.where = jest.fn().mockReturnValue(qb);
  qb.setParameters = jest.fn().mockReturnValue(qb);
  qb.execute = execute;

  return { qb, execute };
}

/** Builds a select (guard) query builder mock. */
function makeSelectQb(point: unknown): {
  qb: Record<string, unknown>;
  getOne: jest.Mock;
} {
  const qb: Record<string, unknown> = {};
  const getOne = jest.fn<() => Promise<unknown>>().mockResolvedValue(point);
  qb.select = jest.fn().mockReturnValue(qb);
  qb.where = jest.fn().mockReturnValue(qb);
  qb.getOne = getOne;

  return { qb, getOne };
}

describe('UpdateMemoryPointLocationHandler', () => {
  describe('admin path (shouldSkipOwnershipCheck = true)', () => {
    let handler: UpdateMemoryPointLocationHandler;
    let execute: jest.Mock;
    let getOne: jest.Mock;

    beforeEach(() => {
      const { qb: updateQb, execute: ex } = makeUpdateQb(1);
      execute = ex;
      // Only the getOne spy is needed (to assert the admin path never reads).
      const { getOne: go } = makeSelectQb(null);
      getOne = go;

      // Admin: skip=true → only update call
      const createQueryBuilder = jest.fn().mockReturnValueOnce(updateQb);
      handler = new UpdateMemoryPointLocationHandler({
        createQueryBuilder,
      } as never);
    });

    it('updates location without ownership/status check', async () => {
      await expect(
        handler.execute(
          new UpdateMemoryPointLocationCommand(POINT_ID, LAT, LNG, true),
        ),
      ).resolves.toBeUndefined();

      expect(getOne).not.toHaveBeenCalled();
      expect(execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('admin path — point not found (affected = 0)', () => {
    let handler: UpdateMemoryPointLocationHandler;

    beforeEach(() => {
      const { qb: updateQb } = makeUpdateQb(0);
      const createQueryBuilder = jest.fn().mockReturnValueOnce(updateQb);
      handler = new UpdateMemoryPointLocationHandler({
        createQueryBuilder,
      } as never);
    });

    it('throws MemoryPointNotFoundException when no row was updated', async () => {
      await expect(
        handler.execute(
          new UpdateMemoryPointLocationCommand(POINT_ID, LAT, LNG, true),
        ),
      ).rejects.toBeInstanceOf(MemoryPointNotFoundException);
    });
  });

  describe('creator path — owner, PENDING point', () => {
    let handler: UpdateMemoryPointLocationHandler;
    let execute: jest.Mock;

    beforeEach(() => {
      const point = {
        id: POINT_ID,
        userId: OWNER_ID,
        status: MemoryPointStatus.PENDING,
      };
      const { qb: selectQb } = makeSelectQb(point);
      const { qb: updateQb, execute: ex } = makeUpdateQb(1);
      execute = ex;

      // Creator: skip=false → select first, then update
      const createQueryBuilder = jest
        .fn()
        .mockReturnValueOnce(selectQb)
        .mockReturnValueOnce(updateQb);
      handler = new UpdateMemoryPointLocationHandler({
        createQueryBuilder,
      } as never);
    });

    it('updates location successfully', async () => {
      await expect(
        handler.execute(
          new UpdateMemoryPointLocationCommand(
            POINT_ID,
            LAT,
            LNG,
            false,
            OWNER_ID,
          ),
        ),
      ).resolves.toBeUndefined();

      expect(execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('creator path — wrong owner', () => {
    let handler: UpdateMemoryPointLocationHandler;

    beforeEach(() => {
      const point = {
        id: POINT_ID,
        userId: OWNER_ID,
        status: MemoryPointStatus.PENDING,
      };
      const { qb: selectQb } = makeSelectQb(point);
      const { qb: updateQb } = makeUpdateQb(1);

      const createQueryBuilder = jest
        .fn()
        .mockReturnValueOnce(selectQb)
        .mockReturnValueOnce(updateQb);
      handler = new UpdateMemoryPointLocationHandler({
        createQueryBuilder,
      } as never);
    });

    it('throws MemoryPointNotFoundException when userId does not match', async () => {
      await expect(
        handler.execute(
          new UpdateMemoryPointLocationCommand(
            POINT_ID,
            LAT,
            LNG,
            false,
            OTHER_ID,
          ),
        ),
      ).rejects.toBeInstanceOf(MemoryPointNotFoundException);
    });
  });

  describe('creator path — non-PENDING point', () => {
    let handler: UpdateMemoryPointLocationHandler;

    beforeEach(() => {
      const point = {
        id: POINT_ID,
        userId: OWNER_ID,
        status: MemoryPointStatus.ADMIN_REVIEWING,
      };
      const { qb: selectQb } = makeSelectQb(point);
      const { qb: updateQb } = makeUpdateQb(1);

      const createQueryBuilder = jest
        .fn()
        .mockReturnValueOnce(selectQb)
        .mockReturnValueOnce(updateQb);
      handler = new UpdateMemoryPointLocationHandler({
        createQueryBuilder,
      } as never);
    });

    it('throws MemoryPointNotEditableException for non-PENDING status', async () => {
      await expect(
        handler.execute(
          new UpdateMemoryPointLocationCommand(
            POINT_ID,
            LAT,
            LNG,
            false,
            OWNER_ID,
          ),
        ),
      ).rejects.toBeInstanceOf(MemoryPointNotEditableException);
    });
  });

  describe('creator path — point not found in DB', () => {
    let handler: UpdateMemoryPointLocationHandler;

    beforeEach(() => {
      // getOne returns undefined (point not found)
      const { qb: selectQb } = makeSelectQb(null);
      const { qb: updateQb } = makeUpdateQb(0);

      const createQueryBuilder = jest
        .fn()
        .mockReturnValueOnce(selectQb)
        .mockReturnValueOnce(updateQb);
      handler = new UpdateMemoryPointLocationHandler({
        createQueryBuilder,
      } as never);
    });

    it('throws MemoryPointNotFoundException when point does not exist', async () => {
      await expect(
        handler.execute(
          new UpdateMemoryPointLocationCommand(
            POINT_ID,
            LAT,
            LNG,
            false,
            OWNER_ID,
          ),
        ),
      ).rejects.toBeInstanceOf(MemoryPointNotFoundException);
    });
  });
});
