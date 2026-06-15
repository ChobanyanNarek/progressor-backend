import { describe, expect, it, jest } from '@jest/globals';

import { PublicationState } from '../../../../constants/publication-state.ts';
import { InvalidPublicationStateTransitionException } from '../../exceptions/invalid-publication-state-transition.exception.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { UpdatePublicationStateCommand } from './update-publication-state.command.ts';
import { UpdatePublicationStateHandler } from './update-publication-state.handler.ts';

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

describe('UpdatePublicationStateHandler', () => {
  const pointId = 'point-1' as Uuid;

  function setup(existingState: PublicationState | null): {
    handler: UpdatePublicationStateHandler;
    updateQb: IQb;
  } {
    const readQb = makeReadQb(
      existingState === null
        ? null
        : { id: pointId, publicationState: existingState },
    );
    const updateQb = makeUpdateQb();
    let callCount = 0;
    const createQueryBuilder = jest.fn().mockImplementation(() => {
      callCount++;

      return callCount === 1 ? readQb : updateQb;
    });

    const handler = new UpdatePublicationStateHandler({
      createQueryBuilder,
    } as never);

    return { handler, updateQb };
  }

  it('throws MemoryPointNotFoundException when point does not exist', async () => {
    const { handler } = setup(null);

    await expect(
      handler.execute(
        new UpdatePublicationStateCommand(pointId, PublicationState.INACTIVE),
      ),
    ).rejects.toBeInstanceOf(MemoryPointNotFoundException);
  });

  describe('legal transitions', () => {
    const legalCases: Array<[PublicationState, PublicationState]> = [
      [PublicationState.ACTIVE, PublicationState.INACTIVE],
      [PublicationState.ACTIVE, PublicationState.ARCHIVED],
      [PublicationState.INACTIVE, PublicationState.ACTIVE],
      [PublicationState.INACTIVE, PublicationState.ARCHIVED],
      // ARCHIVED is NOT terminal for admin
      [PublicationState.ARCHIVED, PublicationState.ACTIVE],
      [PublicationState.ARCHIVED, PublicationState.INACTIVE],
    ];

    it.each(legalCases)('%s → %s succeeds', async (from, to) => {
      const { handler, updateQb } = setup(from);

      await expect(
        handler.execute(new UpdatePublicationStateCommand(pointId, to)),
      ).resolves.toBeUndefined();

      expect(updateQb.set).toHaveBeenCalledWith({ publicationState: to });
    });
  });

  describe('illegal transitions (same-state no-ops)', () => {
    const illegalCases: Array<[PublicationState, PublicationState]> = [
      [PublicationState.ACTIVE, PublicationState.ACTIVE],
      [PublicationState.INACTIVE, PublicationState.INACTIVE],
      [PublicationState.ARCHIVED, PublicationState.ARCHIVED],
    ];

    it.each(illegalCases)(
      '%s → %s throws InvalidPublicationStateTransitionException',
      async (from, to) => {
        const { handler } = setup(from);

        await expect(
          handler.execute(new UpdatePublicationStateCommand(pointId, to)),
        ).rejects.toBeInstanceOf(InvalidPublicationStateTransitionException);
      },
    );
  });
});
