import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { AiGenerationStatus } from '../../../../constants/ai-generation-status.ts';
import { ApplyGenerationResultCommand } from './apply-generation-result.command.ts';
import { ApplyGenerationResultHandler } from './apply-generation-result.handler.ts';

describe('ApplyGenerationResultHandler', () => {
  let handler: ApplyGenerationResultHandler;
  let detailsUpdate: jest.Mock;
  let detailsRepo: { update: jest.Mock };

  const pointId = 'point-1' as Uuid;

  beforeEach(() => {
    detailsUpdate = jest
      .fn<() => Promise<unknown>>()
      .mockResolvedValue({ affected: 1 });
    detailsRepo = { update: detailsUpdate };
    handler = new ApplyGenerationResultHandler(detailsRepo as never);
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

  it('does not update details when videoUrl is undefined', async () => {
    await handler.execute(
      new ApplyGenerationResultCommand(pointId, {
        status: AiGenerationStatus.COMPLETED,
      }),
    );

    expect(detailsUpdate).not.toHaveBeenCalled();
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
});
