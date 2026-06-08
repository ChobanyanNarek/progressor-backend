import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { MemoryPointType } from '../../../../constants/memory-point-type.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { UpdateMemoryPointDetailsCommand } from './update-memory-point-details.command.ts';
import { UpdateMemoryPointDetailsHandler } from './update-memory-point-details.handler.ts';

describe('UpdateMemoryPointDetailsHandler', () => {
  let handler: UpdateMemoryPointDetailsHandler;
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
    handler = new UpdateMemoryPointDetailsHandler(repo as never);
  });

  it('updates all provided fields and scopes the where to memory_point_id', async () => {
    await handler.execute(
      new UpdateMemoryPointDetailsCommand(pointId, {
        title: 'New title',
        description: 'New description',
        cloudAnchorId: 'anchor-1',
        type: MemoryPointType.MEMORIAL,
      }),
    );

    expect(set).toHaveBeenCalledWith({
      title: 'New title',
      description: 'New description',
      cloudAnchorId: 'anchor-1',
      type: MemoryPointType.MEMORIAL,
    });
    expect(where).toHaveBeenCalledWith('memory_point_id = :memoryPointId', {
      memoryPointId: pointId,
    });
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('includes only defined fields in the update payload (partial update)', async () => {
    await handler.execute(
      new UpdateMemoryPointDetailsCommand(pointId, {
        title: 'Only title',
      }),
    );

    expect(set).toHaveBeenCalledWith({ title: 'Only title' });

    const payload = set.mock.calls[0]![0] as Record<string, unknown>;
    expect(Object.keys(payload)).toEqual(['title']);
    expect('description' in payload).toBe(false);
    expect('cloudAnchorId' in payload).toBe(false);
    expect('type' in payload).toBe(false);
  });

  it('passes an empty payload when no fields are provided', async () => {
    await handler.execute(new UpdateMemoryPointDetailsCommand(pointId, {}));

    expect(set).toHaveBeenCalledWith({});
  });

  it('throws MemoryPointNotFoundException when nothing was updated', async () => {
    execute.mockResolvedValue({ affected: 0 });

    await expect(
      handler.execute(
        new UpdateMemoryPointDetailsCommand(pointId, { title: 'x' }),
      ),
    ).rejects.toBeInstanceOf(MemoryPointNotFoundException);
  });
});
