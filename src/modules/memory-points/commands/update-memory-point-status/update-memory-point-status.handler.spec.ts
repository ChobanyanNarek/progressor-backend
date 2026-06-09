import { describe, expect, it, jest } from '@jest/globals';

import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { InvalidStatusTransitionException } from '../../exceptions/invalid-status-transition.exception.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { UpdateMemoryPointStatusCommand } from './update-memory-point-status.command.ts';
import { UpdateMemoryPointStatusHandler } from './update-memory-point-status.handler.ts';

interface IQb {
  select: jest.Mock;
  where: jest.Mock;
  getOne: jest.Mock;
  update: jest.Mock;
  set: jest.Mock;
  execute: jest.Mock;
}

function makeReadQb(result: unknown): IQb {
  const qb: Partial<IQb> = {};

  qb.select = jest.fn().mockReturnValue(qb);
  qb.where = jest.fn().mockReturnValue(qb);
  qb.getOne = jest.fn<() => Promise<unknown>>().mockResolvedValue(result);

  return qb as IQb;
}

function makeUpdateQb(): IQb {
  const qb: Partial<IQb> = {};

  qb.update = jest.fn().mockReturnValue(qb);
  qb.set = jest.fn().mockReturnValue(qb);
  qb.where = jest.fn().mockReturnValue(qb);
  qb.execute = jest
    .fn<() => Promise<unknown>>()
    .mockResolvedValue({ affected: 1 });

  return qb as IQb;
}

describe('UpdateMemoryPointStatusHandler', () => {
  const pointId = 'point-1' as Uuid;

  function setup(existingStatus: MemoryPointStatus | null): {
    handler: UpdateMemoryPointStatusHandler;
    readQb: IQb;
    updateQb: IQb;
    createQueryBuilder: jest.Mock;
  } {
    const readQb = makeReadQb(
      existingStatus === null ? null : { id: pointId, status: existingStatus },
    );
    const updateQb = makeUpdateQb();
    let callCount = 0;
    const createQueryBuilder = jest.fn().mockImplementation(() => {
      // First call is the SELECT (read); subsequent calls are the UPDATE.
      callCount++;

      return callCount === 1 ? readQb : updateQb;
    });

    const handler = new UpdateMemoryPointStatusHandler({
      createQueryBuilder,
    } as never);

    return { handler, readQb, updateQb, createQueryBuilder };
  }

  it('throws MemoryPointNotFoundException when point does not exist', async () => {
    const { handler } = setup(null);

    await expect(
      handler.execute(
        new UpdateMemoryPointStatusCommand(
          pointId,
          MemoryPointStatus.ADMIN_REVIEWING,
        ),
      ),
    ).rejects.toBeInstanceOf(MemoryPointNotFoundException);
  });

  describe('legal transitions', () => {
    const legalCases: Array<[MemoryPointStatus, MemoryPointStatus]> = [
      [MemoryPointStatus.PENDING, MemoryPointStatus.ADMIN_REVIEWING],
      [MemoryPointStatus.ADMIN_REVIEWING, MemoryPointStatus.GENERATING],
      [MemoryPointStatus.ADMIN_REVIEWING, MemoryPointStatus.REJECTED],
      [MemoryPointStatus.GENERATING, MemoryPointStatus.AI_REVIEWING],
      [MemoryPointStatus.AI_REVIEWING, MemoryPointStatus.APPROVED],
      [MemoryPointStatus.AI_REVIEWING, MemoryPointStatus.REJECTED],
      [MemoryPointStatus.REJECTED, MemoryPointStatus.ADMIN_REVIEWING],
    ];

    it.each(legalCases)('%s → %s succeeds', async (from, to) => {
      const { handler, updateQb } = setup(from);

      await expect(
        handler.execute(new UpdateMemoryPointStatusCommand(pointId, to)),
      ).resolves.toBeUndefined();

      expect(updateQb.set).toHaveBeenCalledWith({ status: to });
    });
  });

  describe('illegal transitions', () => {
    const illegalCases: Array<[MemoryPointStatus, MemoryPointStatus]> = [
      [MemoryPointStatus.PENDING, MemoryPointStatus.APPROVED],
      [MemoryPointStatus.PENDING, MemoryPointStatus.GENERATING],
      [MemoryPointStatus.APPROVED, MemoryPointStatus.PENDING],
      [MemoryPointStatus.APPROVED, MemoryPointStatus.REJECTED],
      [MemoryPointStatus.GENERATING, MemoryPointStatus.APPROVED],
      [MemoryPointStatus.ADMIN_REVIEWING, MemoryPointStatus.APPROVED],
      [MemoryPointStatus.AI_REVIEWING, MemoryPointStatus.PENDING],
    ];

    it.each(illegalCases)(
      '%s → %s throws InvalidStatusTransitionException',
      async (from, to) => {
        const { handler } = setup(from);

        await expect(
          handler.execute(new UpdateMemoryPointStatusCommand(pointId, to)),
        ).rejects.toBeInstanceOf(InvalidStatusTransitionException);
      },
    );
  });
});
