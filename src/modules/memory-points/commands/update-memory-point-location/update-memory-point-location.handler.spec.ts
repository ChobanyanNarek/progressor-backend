import { describe, expect, it, jest } from '@jest/globals';

import {
  DEDUP_LIVE_STATUSES,
  MemoryPointStatus,
} from '../../../../constants/memory-point-status.ts';
import { DuplicateMemoryPointException } from '../../exceptions/duplicate-memory-point.exception.ts';
import { MemoryPointNotEditableException } from '../../exceptions/memory-point-not-editable.exception.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { UpdateMemoryPointLocationCommand } from './update-memory-point-location.command.ts';
import { UpdateMemoryPointLocationHandler } from './update-memory-point-location.handler.ts';

const POINT_ID = 'point-1' as Uuid;
const OTHER_ID = 'point-2' as Uuid;
const USER_ID = 'user-1' as Uuid;
const DUPLICATE_RADIUS_METERS = 50;

interface IDupQb {
  select: jest.Mock;
  addSelect: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  setParameters: jest.Mock;
  orderBy: jest.Mock;
  getRawOne: jest.Mock;
}

interface IUpdateQb {
  update: jest.Mock;
  set: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  setParameters: jest.Mock;
  execute: jest.Mock;
}

interface ISelectQb {
  select: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  getOne: jest.Mock;
}

/** Duplicate-proximity check builder. `near` is the nearest live point, or null. */
function makeDupQb(near: { id: Uuid; distance: string } | null): IDupQb {
  const qb: Partial<IDupQb> = {};
  qb.select = jest.fn().mockReturnValue(qb);
  qb.addSelect = jest.fn().mockReturnValue(qb);
  qb.where = jest.fn().mockReturnValue(qb);
  qb.andWhere = jest.fn().mockReturnValue(qb);
  qb.setParameters = jest.fn().mockReturnValue(qb);
  qb.orderBy = jest.fn().mockReturnValue(qb);
  qb.getRawOne = jest
    .fn<() => Promise<unknown>>()
    .mockResolvedValue(near ?? undefined);

  return qb as IDupQb;
}

function makeUpdateQb(affected: number): IUpdateQb {
  const qb: Partial<IUpdateQb> = {};
  qb.update = jest.fn().mockReturnValue(qb);
  qb.set = jest.fn().mockReturnValue(qb);
  qb.where = jest.fn().mockReturnValue(qb);
  qb.andWhere = jest.fn().mockReturnValue(qb);
  qb.setParameters = jest.fn().mockReturnValue(qb);
  qb.execute = jest
    .fn<() => Promise<unknown>>()
    .mockResolvedValue({ affected });

  return qb as IUpdateQb;
}

function makeSelectQb(owned: unknown): ISelectQb {
  const qb: Partial<ISelectQb> = {};
  qb.select = jest.fn().mockReturnValue(qb);
  qb.where = jest.fn().mockReturnValue(qb);
  qb.andWhere = jest.fn().mockReturnValue(qb);
  qb.getOne = jest.fn<() => Promise<unknown>>().mockResolvedValue(owned);

  return qb as ISelectQb;
}

function makeHandler(builders: Array<IDupQb | IUpdateQb | ISelectQb>): {
  handler: UpdateMemoryPointLocationHandler;
  createQueryBuilder: jest.Mock;
} {
  const createQueryBuilder = jest.fn();

  for (const b of builders) {
    createQueryBuilder.mockReturnValueOnce(b);
  }

  const handler = new UpdateMemoryPointLocationHandler(
    { createQueryBuilder } as never,
    { duplicateRadiusMeters: DUPLICATE_RADIUS_METERS } as never,
  );

  return { handler, createQueryBuilder };
}

describe('UpdateMemoryPointLocationHandler', () => {
  describe('duplicate-proximity guard', () => {
    it('blocks the move when another live point is within the radius', async () => {
      // Dup check finds a different nearby point — update is never attempted.
      const { handler, createQueryBuilder } = makeHandler([
        makeDupQb({ id: OTHER_ID, distance: '5' }),
      ]);

      await expect(
        handler.execute(
          new UpdateMemoryPointLocationCommand(POINT_ID, 40, 44, {
            kind: 'admin',
          }),
        ),
      ).rejects.toBeInstanceOf(DuplicateMemoryPointException);

      // Only the dup-check builder ran; no UPDATE.
      expect(createQueryBuilder).toHaveBeenCalledTimes(1);
    });

    it('excludes the point being moved from the duplicate candidates', async () => {
      const dupQb = makeDupQb(null);
      const { handler } = makeHandler([dupQb, makeUpdateQb(1)]);

      await handler.execute(
        new UpdateMemoryPointLocationCommand(POINT_ID, 40, 44, {
          kind: 'admin',
        }),
      );

      expect(dupQb.andWhere).toHaveBeenCalledWith('mp.id != :selfId', {
        selfId: POINT_ID,
      });
      /*
       * Only live points are candidates, mirroring create — PENDING and
       * REJECTED never block.
       */
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

  describe('admin path', () => {
    it('updates any point by id alone and resolves', async () => {
      const updateQb = makeUpdateQb(1);
      const { handler } = makeHandler([makeDupQb(null), updateQb]);

      await expect(
        handler.execute(
          new UpdateMemoryPointLocationCommand(POINT_ID, 40, 44, {
            kind: 'admin',
          }),
        ),
      ).resolves.toBeUndefined();

      expect(updateQb.where).toHaveBeenCalledWith('id = :id', { id: POINT_ID });
      // Admin path applies no ownership/status guard.
      expect(updateQb.andWhere).not.toHaveBeenCalled();
    });

    it('throws MemoryPointNotFoundException when no row is updated', async () => {
      const { handler } = makeHandler([makeDupQb(null), makeUpdateQb(0)]);

      await expect(
        handler.execute(
          new UpdateMemoryPointLocationCommand(POINT_ID, 40, 44, {
            kind: 'admin',
          }),
        ),
      ).rejects.toBeInstanceOf(MemoryPointNotFoundException);
    });
  });

  describe('creator path', () => {
    it('updates only an own PENDING point — guard is in the UPDATE WHERE', async () => {
      const updateQb = makeUpdateQb(1);
      const { handler } = makeHandler([makeDupQb(null), updateQb]);

      await expect(
        handler.execute(
          new UpdateMemoryPointLocationCommand(POINT_ID, 40, 44, {
            kind: 'creator',
            userId: USER_ID,
          }),
        ),
      ).resolves.toBeUndefined();

      expect(updateQb.where).toHaveBeenCalledWith('id = :id', { id: POINT_ID });
      expect(updateQb.andWhere).toHaveBeenCalledWith('user_id = :userId', {
        userId: USER_ID,
      });
      expect(updateQb.andWhere).toHaveBeenCalledWith('status = :status', {
        status: MemoryPointStatus.PENDING,
      });
    });

    it('throws NotEditable when the point is owned but no longer PENDING', async () => {
      // Update matches nothing; the classification read finds an owned row.
      const { handler } = makeHandler([
        makeDupQb(null),
        makeUpdateQb(0),
        makeSelectQb({ id: POINT_ID, status: MemoryPointStatus.APPROVED }),
      ]);

      await expect(
        handler.execute(
          new UpdateMemoryPointLocationCommand(POINT_ID, 40, 44, {
            kind: 'creator',
            userId: USER_ID,
          }),
        ),
      ).rejects.toBeInstanceOf(MemoryPointNotEditableException);
    });

    it('throws NotFound when the point does not exist or is not owned', async () => {
      const { handler } = makeHandler([
        makeDupQb(null),
        makeUpdateQb(0),
        makeSelectQb(null),
      ]);

      await expect(
        handler.execute(
          new UpdateMemoryPointLocationCommand(POINT_ID, 40, 44, {
            kind: 'creator',
            userId: USER_ID,
          }),
        ),
      ).rejects.toBeInstanceOf(MemoryPointNotFoundException);
    });
  });
});
