import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { DeleteMemoryPointCommand } from './delete-memory-point.command.ts';
import { DeleteMemoryPointHandler } from './delete-memory-point.handler.ts';

describe('DeleteMemoryPointHandler', () => {
  let handler: DeleteMemoryPointHandler;
  let del: jest.Mock<() => Promise<unknown>>;
  let repo: { delete: jest.Mock };
  let record: jest.Mock;

  const pointId = 'point-1' as Uuid;
  const actorId = 'admin-1' as Uuid;

  beforeEach(() => {
    del = jest.fn<() => Promise<unknown>>().mockResolvedValue({ affected: 1 });
    repo = { delete: del };
    record = jest.fn();
    handler = new DeleteMemoryPointHandler(repo as never, { record } as never);
  });

  it('deletes the memory point by id and resolves on success', async () => {
    await expect(
      handler.execute(new DeleteMemoryPointCommand(pointId, actorId)),
    ).resolves.toBeUndefined();

    expect(del).toHaveBeenCalledTimes(1);
    expect(del).toHaveBeenCalledWith({ id: pointId });
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        memoryPointId: pointId,
        context: { actorId },
      }),
    );
  });

  it('throws MemoryPointNotFoundException when nothing was deleted', async () => {
    del.mockResolvedValue({ affected: 0 });

    await expect(
      handler.execute(new DeleteMemoryPointCommand(pointId, actorId)),
    ).rejects.toBeInstanceOf(MemoryPointNotFoundException);

    expect(record).not.toHaveBeenCalled();
  });
});
