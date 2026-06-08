import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { UpdateMemoryPointStatusCommand } from './update-memory-point-status.command.ts';
import { UpdateMemoryPointStatusHandler } from './update-memory-point-status.handler.ts';

describe('UpdateMemoryPointStatusHandler', () => {
  let handler: UpdateMemoryPointStatusHandler;
  let execute: jest.Mock<() => Promise<unknown>>;
  let where: jest.Mock;
  let set: jest.Mock;
  let update: jest.Mock;
  let repo: { createQueryBuilder: jest.Mock };

  const pointId = 'point-1' as Uuid;

  beforeEach(() => {
    execute = jest
      .fn<() => Promise<unknown>>()
      .mockResolvedValue({ affected: 1 });
    where = jest.fn().mockReturnValue({ execute });
    set = jest.fn().mockReturnValue({ where });
    update = jest.fn().mockReturnValue({ set });
    repo = { createQueryBuilder: jest.fn().mockReturnValue({ update }) };
    handler = new UpdateMemoryPointStatusHandler(repo as never);
  });

  it('updates the memory point status via the query builder', async () => {
    await expect(
      handler.execute(
        new UpdateMemoryPointStatusCommand(pointId, MemoryPointStatus.APPROVED),
      ),
    ).resolves.toBeUndefined();

    expect(set).toHaveBeenCalledWith({ status: MemoryPointStatus.APPROVED });
    expect(where).toHaveBeenCalledWith('id = :id', { id: pointId });
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('throws MemoryPointNotFoundException when nothing was updated', async () => {
    execute.mockResolvedValue({ affected: 0 });

    await expect(
      handler.execute(
        new UpdateMemoryPointStatusCommand(pointId, MemoryPointStatus.APPROVED),
      ),
    ).rejects.toBeInstanceOf(MemoryPointNotFoundException);
  });
});
