import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { MemoryPointNotReadyForGenerationException } from '../../exceptions/memory-point-not-ready-for-generation.exception.ts';
import { GetMemoryPointGenerationSourceHandler } from './get-memory-point-generation-source.handler.ts';
import { GetMemoryPointGenerationSourceQuery } from './get-memory-point-generation-source.query.ts';

describe('GetMemoryPointGenerationSourceHandler', () => {
  let handler: GetMemoryPointGenerationSourceHandler;
  let getOne: jest.Mock<() => Promise<unknown>>;
  let where: jest.Mock;

  const memoryPointId = 'point-1' as Uuid;

  /** A details row with every generation-required field populated. */
  const completeDetails = {
    sourcePhotoUrl: 'photo.jpg',
    sourceAudioUrl: 'audio.mp3',
    title: 'A title',
    description: 'A description',
    other: 'ignored',
  };

  beforeEach(() => {
    getOne = jest.fn<() => Promise<unknown>>();
    where = jest.fn().mockReturnThis();
    handler = new GetMemoryPointGenerationSourceHandler({
      createQueryBuilder: jest.fn(() => ({ where, getOne })),
    } as never);
  });

  const run = (): Promise<unknown> =>
    handler.execute(new GetMemoryPointGenerationSourceQuery(memoryPointId));

  it('returns the sources when every required field is present', async () => {
    getOne.mockResolvedValue(completeDetails);

    const result = await run();

    expect(where).toHaveBeenCalledWith(
      'details.memoryPointId = :memoryPointId',
      { memoryPointId },
    );
    expect(result).toEqual({
      sourcePhotoUrl: 'photo.jpg',
      sourceAudioUrl: 'audio.mp3',
    });
  });

  it('throws MemoryPointNotFoundException when details are null', async () => {
    getOne.mockResolvedValue(null);

    await expect(run()).rejects.toBeInstanceOf(MemoryPointNotFoundException);
  });

  it('throws MemoryPointNotReadyForGeneration listing a single missing source', async () => {
    getOne.mockResolvedValue({ ...completeDetails, sourceAudioUrl: null });

    await expect(run()).rejects.toBeInstanceOf(
      MemoryPointNotReadyForGenerationException,
    );

    await run().catch((error: unknown) => {
      const response = (
        error as MemoryPointNotReadyForGenerationException
      ).getResponse() as { missingFields: string[] };
      expect(response.missingFields).toEqual(['sourceAudioUrl']);
    });
  });

  it('collects every missing field in one pass', async () => {
    getOne.mockResolvedValue({
      sourcePhotoUrl: null,
      sourceAudioUrl: null,
      title: null,
      description: null,
    });

    await run().catch((error: unknown) => {
      const response = (
        error as MemoryPointNotReadyForGenerationException
      ).getResponse() as { missingFields: string[] };
      expect(response.missingFields).toEqual([
        'sourcePhotoUrl',
        'sourceAudioUrl',
        'title',
        'description',
      ]);
    });

    await expect(run()).rejects.toBeInstanceOf(
      MemoryPointNotReadyForGenerationException,
    );
  });

  it.each([['title'], ['description']])(
    'treats a missing %s as not ready for generation',
    async (field) => {
      getOne.mockResolvedValue({ ...completeDetails, [field]: null });

      await expect(run()).rejects.toBeInstanceOf(
        MemoryPointNotReadyForGenerationException,
      );
    },
  );
});
