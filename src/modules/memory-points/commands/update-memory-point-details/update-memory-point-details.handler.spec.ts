import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { MemoryPointType } from '../../../../constants/memory-point-type.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { UpdateMemoryPointDetailsCommand } from './update-memory-point-details.command.ts';
import { UpdateMemoryPointDetailsHandler } from './update-memory-point-details.handler.ts';

const pointId = 'point-1' as Uuid;

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

    handler = new UpdateMemoryPointDetailsHandler(
      memoryPointRepo as never,
      detailsRepo as never,
      { record } as never,
    );
  }

  beforeEach(() => {
    setup({ id: pointId }, null);
  });

  it('throws MemoryPointNotFoundException when the memory point does not exist', async () => {
    setup(null, null);

    await expect(
      handler.execute(
        new UpdateMemoryPointDetailsCommand(pointId, { title: 'x' }),
      ),
    ).rejects.toBeInstanceOf(MemoryPointNotFoundException);

    // Must short-circuit before touching the details repository.
    expect(detailsRepo.createQueryBuilder).not.toHaveBeenCalled();
    expect(record).not.toHaveBeenCalled();
  });

  it('UPDATEs the existing details row with only the defined metadata fields', async () => {
    setup({ id: pointId }, { id: 'details-1' });

    await handler.execute(
      new UpdateMemoryPointDetailsCommand(pointId, {
        title: 'New title',
        type: MemoryPointType.MEMORIAL,
      }),
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
      expect.objectContaining({ memoryPointId: pointId }),
    );
  });

  it('skips the UPDATE entirely when no metadata fields are provided', async () => {
    setup({ id: pointId }, { id: 'details-1' });

    await handler.execute(new UpdateMemoryPointDetailsCommand(pointId, {}));

    // No write builder is created when there is nothing to set.
    expect(detailsRepo.createQueryBuilder).toHaveBeenCalledTimes(1); // lookup only
    expect(detailsWriteChain.update).not.toHaveBeenCalled();
    expect(detailsWriteChain.insert).not.toHaveBeenCalled();
    // No mutation occurred → no audit entry.
    expect(record).not.toHaveBeenCalled();
  });

  it('INSERTs a new details row (with memoryPointId) when none exists (regression: upsert on absent row)', async () => {
    setup({ id: pointId }, null);

    await handler.execute(
      new UpdateMemoryPointDetailsCommand(pointId, {
        title: 'Fresh',
        description: 'Desc',
        type: MemoryPointType.MEMORIAL,
      }),
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
      expect.objectContaining({ memoryPointId: pointId }),
    );
  });
});
