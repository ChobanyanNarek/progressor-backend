import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { GetMemoryPointGenerationSourceHandler } from './get-memory-point-generation-source.handler.ts';
import { GetMemoryPointGenerationSourceQuery } from './get-memory-point-generation-source.query.ts';

describe('GetMemoryPointGenerationSourceHandler', () => {
  let handler: GetMemoryPointGenerationSourceHandler;
  let findOneBy: jest.Mock<() => Promise<unknown>>;

  const memoryPointId = 'point-1' as Uuid;

  beforeEach(() => {
    findOneBy = jest.fn<() => Promise<unknown>>();
    handler = new GetMemoryPointGenerationSourceHandler({
      findOneBy,
    } as never);
  });

  it('returns sourcePhotoUrl and sourceAudioUrl when details exist', async () => {
    findOneBy.mockResolvedValue({
      sourcePhotoUrl: 'photo.jpg',
      sourceAudioUrl: 'audio.mp3',
      other: 'ignored',
    });

    const result = await handler.execute(
      new GetMemoryPointGenerationSourceQuery(memoryPointId),
    );

    expect(findOneBy).toHaveBeenCalledWith({ memoryPointId });
    expect(result).toEqual({
      sourcePhotoUrl: 'photo.jpg',
      sourceAudioUrl: 'audio.mp3',
    });
  });

  it('throws MemoryPointNotFoundException when details are null', async () => {
    findOneBy.mockResolvedValue(null);

    await expect(
      handler.execute(new GetMemoryPointGenerationSourceQuery(memoryPointId)),
    ).rejects.toBeInstanceOf(MemoryPointNotFoundException);
  });
});
