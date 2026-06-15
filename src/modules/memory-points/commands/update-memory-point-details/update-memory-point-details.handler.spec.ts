import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { MemoryPointType } from '../../../../constants/memory-point-type.ts';
import { MemoryPointNotEditableException } from '../../exceptions/memory-point-not-editable.exception.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { MemoryPointSourceNotUploadedException } from '../../exceptions/memory-point-source-not-uploaded.exception.ts';
import { UpdateMemoryPointDetailsCommand } from './update-memory-point-details.command.ts';
import { UpdateMemoryPointDetailsHandler } from './update-memory-point-details.handler.ts';

const pointId = 'point-1' as Uuid;
const actorId = 'admin-1' as Uuid;

/** Chainable QueryBuilder stub whose terminal `getOne`/`execute` is overridable. */
function makeChain(terminal: {
  getOne?: jest.Mock;
  execute?: jest.Mock;
}): Record<string, jest.Mock> {
  const chain: Record<string, jest.Mock> = {};

  for (const m of ['where', 'update', 'insert', 'set', 'values'] as const) {
    chain[m] = jest.fn().mockReturnValue(chain);
  }

  chain.getOne =
    terminal.getOne ??
    jest.fn<() => Promise<unknown>>().mockResolvedValue(null);
  chain.execute =
    terminal.execute ??
    jest.fn<() => Promise<unknown>>().mockResolvedValue({ affected: 1 });

  return chain;
}

describe('UpdateMemoryPointDetailsHandler', () => {
  let handler: UpdateMemoryPointDetailsHandler;

  let memoryPointChain: Record<string, jest.Mock>;
  let detailsLookupChain: Record<string, jest.Mock>;
  let detailsWriteChain: Record<string, jest.Mock>;

  let memoryPointRepo: { createQueryBuilder: jest.Mock };
  let detailsRepo: { createQueryBuilder: jest.Mock };
  let record: jest.Mock;
  let exists: jest.Mock<(path: string) => Promise<boolean>>;

  /** An editable point — admin edits are allowed in this status. */
  const editablePoint = {
    id: pointId,
    status: MemoryPointStatus.ADMIN_REVIEWING,
  };

  /**
   * @param point  what the memory-point lookup resolves to.
   * @param details what the details lookup resolves to.
   */
  function setup(point: unknown, details: unknown): void {
    memoryPointChain = makeChain({
      getOne: jest.fn<() => Promise<unknown>>().mockResolvedValue(point),
    });
    detailsLookupChain = makeChain({
      getOne: jest.fn<() => Promise<unknown>>().mockResolvedValue(details),
    });
    detailsWriteChain = makeChain({});

    memoryPointRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(memoryPointChain),
    };

    // First call → details lookup (alias 'details'); subsequent → write builder.
    detailsRepo = {
      createQueryBuilder: jest
        .fn()
        .mockReturnValueOnce(detailsLookupChain)
        .mockReturnValue(detailsWriteChain),
    };

    record = jest.fn();
    exists = jest
      .fn<(path: string) => Promise<boolean>>()
      .mockResolvedValue(true);

    handler = new UpdateMemoryPointDetailsHandler(
      memoryPointRepo as never,
      detailsRepo as never,
      { record } as never,
      { exists } as never,
    );
  }

  beforeEach(() => {
    setup(editablePoint, null);
  });

  it('throws MemoryPointNotFoundException when the memory point does not exist', async () => {
    setup(null, null);

    await expect(
      handler.execute(
        new UpdateMemoryPointDetailsCommand(pointId, { title: 'x' }, actorId),
      ),
    ).rejects.toBeInstanceOf(MemoryPointNotFoundException);

    // Must short-circuit before touching the details repository.
    expect(detailsRepo.createQueryBuilder).not.toHaveBeenCalled();
    expect(record).not.toHaveBeenCalled();
  });

  it.each([
    [MemoryPointStatus.PENDING],
    [MemoryPointStatus.GENERATING],
    [MemoryPointStatus.AI_REVIEWING],
    [MemoryPointStatus.APPROVED],
  ])(
    'throws MemoryPointNotEditableException when status is %s',
    async (status) => {
      setup({ id: pointId, status }, { id: 'details-1' });

      await expect(
        handler.execute(
          new UpdateMemoryPointDetailsCommand(pointId, { title: 'x' }, actorId),
        ),
      ).rejects.toBeInstanceOf(MemoryPointNotEditableException);

      // Must short-circuit before touching the details repository.
      expect(detailsRepo.createQueryBuilder).not.toHaveBeenCalled();
    },
  );

  it('allows editing a REJECTED point', async () => {
    setup(
      { id: pointId, status: MemoryPointStatus.REJECTED },
      { id: 'details-1' },
    );

    await handler.execute(
      new UpdateMemoryPointDetailsCommand(pointId, { title: 'New' }, actorId),
    );

    expect(detailsWriteChain.update).toHaveBeenCalledTimes(1);
  });

  it('UPDATEs the existing details row with only the defined fields', async () => {
    setup(editablePoint, { id: 'details-1' });

    await handler.execute(
      new UpdateMemoryPointDetailsCommand(
        pointId,
        { title: 'New title', type: MemoryPointType.MEMORIAL },
        actorId,
      ),
    );

    expect(detailsWriteChain.update).toHaveBeenCalledTimes(1);
    expect(detailsWriteChain.insert).not.toHaveBeenCalled();
    expect(detailsWriteChain.set).toHaveBeenCalledWith({
      title: 'New title',
      type: MemoryPointType.MEMORIAL,
    });
    expect(detailsWriteChain.where).toHaveBeenCalledWith(
      'memory_point_id = :memoryPointId',
      { memoryPointId: pointId },
    );
    expect(detailsWriteChain.execute).toHaveBeenCalledTimes(1);
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        memoryPointId: pointId,
        context: { actorId },
      }),
    );
  });

  it('persists replacement source media paths', async () => {
    setup(editablePoint, { id: 'details-1' });

    await handler.execute(
      new UpdateMemoryPointDetailsCommand(
        pointId,
        {
          sourcePhotoUrl: 'memory-points/point-1/photo/new.jpg',
          sourceAudioUrl: 'memory-points/point-1/audio/new.mp3',
        },
        actorId,
      ),
    );

    expect(detailsWriteChain.set).toHaveBeenCalledWith({
      sourcePhotoUrl: 'memory-points/point-1/photo/new.jpg',
      sourceAudioUrl: 'memory-points/point-1/audio/new.mp3',
    });
    // Each provided source is existence-checked before persisting.
    expect(exists).toHaveBeenCalledWith('memory-points/point-1/photo/new.jpg');
    expect(exists).toHaveBeenCalledWith('memory-points/point-1/audio/new.mp3');
  });

  it('rejects a replacement source path outside the point prefix (403)', async () => {
    setup(editablePoint, { id: 'details-1' });

    await expect(
      handler.execute(
        new UpdateMemoryPointDetailsCommand(
          pointId,
          { sourcePhotoUrl: 'memory-points/other-point/photo/x.jpg' },
          actorId,
        ),
      ),
    ).rejects.toBeInstanceOf(MemoryPointSourceNotUploadedException);

    // Prefix is rejected before storage is probed or anything is persisted.
    expect(exists).not.toHaveBeenCalled();
    expect(detailsWriteChain.update).not.toHaveBeenCalled();
    expect(record).not.toHaveBeenCalled();
  });

  it('rejects a replacement source whose object does not exist (403)', async () => {
    setup(editablePoint, { id: 'details-1' });
    exists.mockResolvedValue(false);

    await expect(
      handler.execute(
        new UpdateMemoryPointDetailsCommand(
          pointId,
          { sourceAudioUrl: 'memory-points/point-1/audio/missing.mp3' },
          actorId,
        ),
      ),
    ).rejects.toBeInstanceOf(MemoryPointSourceNotUploadedException);

    expect(detailsWriteChain.update).not.toHaveBeenCalled();
    expect(record).not.toHaveBeenCalled();
  });

  it('normalizes a blank source path to "not provided" (no overwrite, no probe)', async () => {
    setup(editablePoint, { id: 'details-1' });

    await handler.execute(
      new UpdateMemoryPointDetailsCommand(
        pointId,
        { title: 'New', sourcePhotoUrl: '   ' },
        actorId,
      ),
    );

    // Blank path skipped: not probed, not part of the SET.
    expect(exists).not.toHaveBeenCalled();
    expect(detailsWriteChain.set).toHaveBeenCalledWith({ title: 'New' });
  });

  it('skips the UPDATE entirely when no fields are provided', async () => {
    setup(editablePoint, { id: 'details-1' });

    await handler.execute(
      new UpdateMemoryPointDetailsCommand(pointId, {}, actorId),
    );

    // No write builder is created when there is nothing to set.
    expect(detailsRepo.createQueryBuilder).toHaveBeenCalledTimes(1); // lookup only
    expect(detailsWriteChain.update).not.toHaveBeenCalled();
    expect(detailsWriteChain.insert).not.toHaveBeenCalled();
    // No mutation occurred → no audit entry.
    expect(record).not.toHaveBeenCalled();
  });

  it('INSERTs a new details row (with memoryPointId) when none exists (regression: upsert on absent row)', async () => {
    setup(editablePoint, null);

    await handler.execute(
      new UpdateMemoryPointDetailsCommand(
        pointId,
        { title: 'Fresh', description: 'Desc', type: MemoryPointType.MEMORIAL },
        actorId,
      ),
    );

    expect(detailsWriteChain.insert).toHaveBeenCalledTimes(1);
    expect(detailsWriteChain.update).not.toHaveBeenCalled();
    expect(detailsWriteChain.values).toHaveBeenCalledWith({
      title: 'Fresh',
      description: 'Desc',
      type: MemoryPointType.MEMORIAL,
      memoryPointId: pointId,
    });
    expect(detailsWriteChain.execute).toHaveBeenCalledTimes(1);
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        memoryPointId: pointId,
        context: { actorId },
      }),
    );
  });
});
