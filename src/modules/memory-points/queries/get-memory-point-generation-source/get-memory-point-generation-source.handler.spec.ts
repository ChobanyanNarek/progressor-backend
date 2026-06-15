import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { GetMemoryPointGenerationSourceHandler } from './get-memory-point-generation-source.handler.ts';
import { GetMemoryPointGenerationSourceQuery } from './get-memory-point-generation-source.query.ts';

describe('GetMemoryPointGenerationSourceHandler', () => {
  let handler: GetMemoryPointGenerationSourceHandler;
  let getOne: jest.Mock<() => Promise<unknown>>;
  let where: jest.Mock;

  const memoryPointId = 'point-1' as Uuid;

  beforeEach(() => {
    getOne = jest.fn<() => Promise<unknown>>();
    where = jest.fn().mockReturnThis();
    handler = new GetMemoryPointGenerationSourceHandler({
      createQueryBuilder: jest.fn(() => ({ where, getOne })),
    } as never);
  });

  const run = (): Promise<unknown> =>
    handler.execute(new GetMemoryPointGenerationSourceQuery(memoryPointId));

  it('returns the generation-relevant fields as-is (pure read, no validation)', async () => {
    getOne.mockResolvedValue({
      sourcePhotoUrl: 'photo.jpg',
      sourceAudioUrl: 'audio.mp3',
      title: 'A title',
      description: 'A description',
      other: 'ignored',
    });

    const result = await run();

    expect(where).toHaveBeenCalledWith(
      'details.memoryPointId = :memoryPointId',
      { memoryPointId },
    );
    expect(result).toEqual({
      sourcePhotoUrl: 'photo.jpg',
      sourceAudioUrl: 'audio.mp3',
      title: 'A title',
      description: 'A description',
    });
  });

  it('maps absent fields to null without throwing (validation lives in the command)', async () => {
    getOne.mockResolvedValue({
      sourcePhotoUrl: 'photo.jpg',
      // sourceAudioUrl / title / description absent
    });

    const result = await run();

    expect(result).toEqual({
      sourcePhotoUrl: 'photo.jpg',
      sourceAudioUrl: null,
      title: null,
      description: null,
    });
  });

  it('throws MemoryPointNotFoundException when the details row is null', async () => {
    getOne.mockResolvedValue(null);

    await expect(run()).rejects.toBeInstanceOf(MemoryPointNotFoundException);
  });
});
