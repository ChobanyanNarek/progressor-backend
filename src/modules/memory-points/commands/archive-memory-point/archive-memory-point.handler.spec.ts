import { describe, expect, it, jest } from '@jest/globals';

import { PublicationState } from '../../../../constants/publication-state.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { ArchiveMemoryPointCommand } from './archive-memory-point.command.ts';
import { ArchiveMemoryPointHandler } from './archive-memory-point.handler.ts';

function setup(updateAffected: number): {
  handler: ArchiveMemoryPointHandler;
  updateQb: {
    update: jest.Mock;
    set: jest.Mock;
    where: jest.Mock;
    execute: jest.Mock;
  };
  softDelete: jest.Mock;
} {
  const updateQb = {
    update: jest.fn(),
    set: jest.fn(),
    where: jest.fn(),
    execute: jest
      .fn<() => Promise<unknown>>()
      .mockResolvedValue({ affected: updateAffected }),
  };

  updateQb.update.mockReturnValue(updateQb);
  updateQb.set.mockReturnValue(updateQb);
  updateQb.where.mockReturnValue(updateQb);

  const softDelete = jest.fn<() => Promise<void>>().mockResolvedValue();

  const repo = {
    createQueryBuilder: jest.fn().mockReturnValue(updateQb),
    softDelete,
  };

  const handler = new ArchiveMemoryPointHandler(repo as never);

  return { handler, updateQb, softDelete };
}

describe('ArchiveMemoryPointHandler', () => {
  const pointId = 'point-1' as Uuid;

  it('sets publicationState=ARCHIVED then calls softDelete', async () => {
    const { handler, updateQb, softDelete } = setup(1);

    await expect(
      handler.execute(new ArchiveMemoryPointCommand(pointId)),
    ).resolves.toBeUndefined();

    expect(updateQb.set).toHaveBeenCalledWith({
      publicationState: PublicationState.ARCHIVED,
    });
    expect(updateQb.where).toHaveBeenCalledWith('id = :id', { id: pointId });
    expect(softDelete).toHaveBeenCalledWith({ id: pointId });
  });

  it('throws MemoryPointNotFoundException when update affects 0 rows', async () => {
    const { handler } = setup(0);

    await expect(
      handler.execute(new ArchiveMemoryPointCommand(pointId)),
    ).rejects.toBeInstanceOf(MemoryPointNotFoundException);
  });

  it('does NOT call softDelete when point is not found', async () => {
    const { handler, softDelete } = setup(0);

    await expect(
      handler.execute(new ArchiveMemoryPointCommand(pointId)),
    ).rejects.toBeInstanceOf(MemoryPointNotFoundException);

    expect(softDelete).not.toHaveBeenCalled();
  });
});
