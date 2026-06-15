import { describe, expect, it, jest } from '@jest/globals';

import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { MemoryPointNotEditableException } from '../../exceptions/memory-point-not-editable.exception.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { UpdateMemoryPointLocationCommand } from './update-memory-point-location.command.ts';
import { UpdateMemoryPointLocationHandler } from './update-memory-point-location.handler.ts';

const POINT_ID = 'point-1' as Uuid;
const USER_ID = 'user-1' as Uuid;

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

function makeHandler(builders: Array<IUpdateQb | ISelectQb>): {
  handler: UpdateMemoryPointLocationHandler;
  createQueryBuilder: jest.Mock;
} {
  const createQueryBuilder = jest.fn();

  for (const b of builders) {
    createQueryBuilder.mockReturnValueOnce(b);
  }

  const handler = new UpdateMemoryPointLocationHandler({
    createQueryBuilder,
  } as never);

  return { handler, createQueryBuilder };
}

describe('UpdateMemoryPointLocationHandler', () => {
  describe('admin path', () => {
    it('updates any point by id alone and resolves', async () => {
      const updateQb = makeUpdateQb(1);
      const { handler } = makeHandler([updateQb]);

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
      const { handler } = makeHandler([makeUpdateQb(0)]);

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
      const { handler } = makeHandler([updateQb]);

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
      const { handler } = makeHandler([makeUpdateQb(0), makeSelectQb(null)]);

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
