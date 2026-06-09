import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { AiGenerationStatus } from '../../../../constants/ai-generation-status.ts';
import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { ApplyGenerationResultCommand } from './apply-generation-result.command.ts';
import { ApplyGenerationResultHandler } from './apply-generation-result.handler.ts';

describe('ApplyGenerationResultHandler', () => {
  let handler: ApplyGenerationResultHandler;
  let detailsUpdate: jest.Mock;
  let detailsRepo: { update: jest.Mock };
  let memoryPointUpdate: jest.Mock;
  let memoryPointRepo: { update: jest.Mock };

  const pointId = 'point-1' as Uuid;

  beforeEach(() => {
    detailsUpdate = jest
      .fn<() => Promise<unknown>>()
      .mockResolvedValue({ affected: 1 });
    detailsRepo = { update: detailsUpdate };
    memoryPointUpdate = jest
      .fn<() => Promise<unknown>>()
      .mockResolvedValue({ affected: 1 });
    memoryPointRepo = { update: memoryPointUpdate };
    handler = new ApplyGenerationResultHandler(
      detailsRepo as never,
      memoryPointRepo as never,
    );
  });

  it('COMPLETED: stores videoUrl', async () => {
    await handler.execute(
      new ApplyGenerationResultCommand(pointId, {
        status: AiGenerationStatus.COMPLETED,
        videoUrl: 'https://cdn/video.mp4',
      }),
    );

    expect(detailsUpdate).toHaveBeenCalledWith(
      { memoryPointId: pointId },
      { videoUrl: 'https://cdn/video.mp4' },
    );
  });

  it('COMPLETED: transitions the memory point to AI_REVIEWING', async () => {
    await handler.execute(
      new ApplyGenerationResultCommand(pointId, {
        status: AiGenerationStatus.COMPLETED,
        videoUrl: 'https://cdn/video.mp4',
      }),
    );

    expect(memoryPointUpdate).toHaveBeenCalledWith(
      { id: pointId },
      { status: MemoryPointStatus.AI_REVIEWING },
    );
  });

  it('does not update details when videoUrl is undefined', async () => {
    await handler.execute(
      new ApplyGenerationResultCommand(pointId, {
        status: AiGenerationStatus.COMPLETED,
      }),
    );

    expect(detailsUpdate).not.toHaveBeenCalled();
  });

  it('COMPLETED without a videoUrl still transitions to AI_REVIEWING', async () => {
    await handler.execute(
      new ApplyGenerationResultCommand(pointId, {
        status: AiGenerationStatus.COMPLETED,
      }),
    );

    expect(memoryPointUpdate).toHaveBeenCalledWith(
      { id: pointId },
      { status: MemoryPointStatus.AI_REVIEWING },
    );
  });

  it('FAILED: does not touch details', async () => {
    await handler.execute(
      new ApplyGenerationResultCommand(pointId, {
        status: AiGenerationStatus.FAILED,
        errorMessage: 'generation failed',
      }),
    );

    expect(detailsUpdate).not.toHaveBeenCalled();
  });

  it('FAILED: returns the memory point to ADMIN_REVIEWING', async () => {
    await handler.execute(
      new ApplyGenerationResultCommand(pointId, {
        status: AiGenerationStatus.FAILED,
        errorMessage: 'generation failed',
      }),
    );

    expect(memoryPointUpdate).toHaveBeenCalledWith(
      { id: pointId },
      { status: MemoryPointStatus.ADMIN_REVIEWING },
    );
  });

  it('FAILED with a videoUrl still updates details', async () => {
    await handler.execute(
      new ApplyGenerationResultCommand(pointId, {
        status: AiGenerationStatus.FAILED,
        videoUrl: 'https://cdn/partial.mp4',
      }),
    );

    expect(detailsUpdate).toHaveBeenCalledWith(
      { memoryPointId: pointId },
      { videoUrl: 'https://cdn/partial.mp4' },
    );
  });

  it('does not update details for non-terminal statuses', async () => {
    await handler.execute(
      new ApplyGenerationResultCommand(pointId, {
        status: AiGenerationStatus.PROCESSING,
      }),
    );

    expect(detailsUpdate).not.toHaveBeenCalled();
  });

  it('does not change the memory point status for non-terminal statuses', async () => {
    await handler.execute(
      new ApplyGenerationResultCommand(pointId, {
        status: AiGenerationStatus.PROCESSING,
      }),
    );

    expect(memoryPointUpdate).not.toHaveBeenCalled();
  });
});
