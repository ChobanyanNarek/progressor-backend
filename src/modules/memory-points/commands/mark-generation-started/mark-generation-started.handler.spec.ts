import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { MarkGenerationStartedCommand } from './mark-generation-started.command.ts';
import { MarkGenerationStartedHandler } from './mark-generation-started.handler.ts';

describe('MarkGenerationStartedHandler', () => {
  let handler: MarkGenerationStartedHandler;
  let update: jest.Mock;
  let repo: { update: jest.Mock };

  const pointId = 'point-1' as Uuid;

  beforeEach(() => {
    update = jest
      .fn<() => Promise<unknown>>()
      .mockResolvedValue({ affected: 1 });
    repo = { update };
    handler = new MarkGenerationStartedHandler(repo as never);
  });

  it('updates the memory point status to GENERATING', async () => {
    await expect(
      handler.execute(new MarkGenerationStartedCommand(pointId)),
    ).resolves.toBeUndefined();

    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(
      { id: pointId },
      { status: MemoryPointStatus.GENERATING },
    );
  });
});
