import { describe, expect, it, jest } from '@jest/globals';

import { PublicationState } from '../../../../constants/publication-state.ts';
import { InvalidPublicationStateTransitionException } from '../../exceptions/invalid-publication-state-transition.exception.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { MemoryPointNotOwnedException } from '../../exceptions/memory-point-not-owned.exception.ts';
import { DeactivateMemoryPointCommand } from './deactivate-memory-point.command.ts';
import { DeactivateMemoryPointHandler } from './deactivate-memory-point.handler.ts';

const pointId = 'point-1' as Uuid;
const ownerId = 'user-owner' as Uuid;
const otherId = 'user-other' as Uuid;

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

function setup(
  existing: { userId: Uuid; publicationState: PublicationState } | null,
): { handler: DeactivateMemoryPointHandler; updateQb: IQb } {
  const readQb = makeReadQb(
    existing === null ? null : { id: pointId, ...existing },
  );
  const updateQb = makeUpdateQb();
  let callCount = 0;
  const createQueryBuilder = jest.fn().mockImplementation(() => {
    callCount++;

    return callCount === 1 ? readQb : updateQb;
  });

  const handler = new DeactivateMemoryPointHandler({
    createQueryBuilder,
  } as never);

  return { handler, updateQb };
}

describe('DeactivateMemoryPointHandler', () => {
  it('throws MemoryPointNotFoundException when point does not exist', async () => {
    const { handler } = setup(null);

    await expect(
      handler.execute(new DeactivateMemoryPointCommand(pointId, ownerId)),
    ).rejects.toBeInstanceOf(MemoryPointNotFoundException);
  });

  it('throws MemoryPointNotOwnedException when caller is not the owner', async () => {
    const { handler } = setup({
      userId: ownerId,
      publicationState: PublicationState.ACTIVE,
    });

    await expect(
      handler.execute(new DeactivateMemoryPointCommand(pointId, otherId)),
    ).rejects.toBeInstanceOf(MemoryPointNotOwnedException);
  });

  it('throws InvalidPublicationStateTransitionException when point is INACTIVE', async () => {
    const { handler } = setup({
      userId: ownerId,
      publicationState: PublicationState.INACTIVE,
    });

    await expect(
      handler.execute(new DeactivateMemoryPointCommand(pointId, ownerId)),
    ).rejects.toBeInstanceOf(InvalidPublicationStateTransitionException);
  });

  it('throws InvalidPublicationStateTransitionException when point is ARCHIVED', async () => {
    const { handler } = setup({
      userId: ownerId,
      publicationState: PublicationState.ARCHIVED,
    });

    await expect(
      handler.execute(new DeactivateMemoryPointCommand(pointId, ownerId)),
    ).rejects.toBeInstanceOf(InvalidPublicationStateTransitionException);
  });

  it('sets publicationState=INACTIVE on success', async () => {
    const { handler, updateQb } = setup({
      userId: ownerId,
      publicationState: PublicationState.ACTIVE,
    });

    await expect(
      handler.execute(new DeactivateMemoryPointCommand(pointId, ownerId)),
    ).resolves.toBeUndefined();

    expect(updateQb.set).toHaveBeenCalledWith({
      publicationState: PublicationState.INACTIVE,
    });
    expect(updateQb.where).toHaveBeenCalledWith('id = :id', { id: pointId });
  });
});
