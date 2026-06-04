import { jest } from '@jest/globals';
import { of } from 'rxjs';

import { AiGenerationStatus } from '../../../../constants/ai-generation-status.ts';
import { ApplyGenerationResultCommand } from '../../../memory-points/commands/apply-generation-result/apply-generation-result.command.ts';
import { ProcessDidWebhookCommand } from './process-did-webhook.command.ts';
import { ProcessDidWebhookHandler } from './process-did-webhook.handler.ts';

interface FakeGeneration {
  id: Uuid;
  memoryPointId: Uuid;
  status: AiGenerationStatus;
  attemptNumber: number;
  didTalkId?: string;
  resultVideoUrl?: string;
  errorMessage?: string;
  durationSeconds?: number;
  toDto: () => Record<string, unknown>;
}

describe('ProcessDidWebhookHandler', () => {
  const talkId = 'talk-123';
  const memoryPointId = 'point-1' as Uuid;
  const generationId = 'gen-1' as Uuid;

  let handler: ProcessDidWebhookHandler;
  let findOneBy: jest.Mock;
  let save: jest.Mock;
  let repo: { findOneBy: jest.Mock; save: jest.Mock };
  let getTalk: jest.Mock;
  let didService: { getTalk: jest.Mock };
  let uploadStream: jest.Mock;
  let gcsService: { uploadStream: jest.Mock };
  let commandBusExecute: jest.Mock;
  let httpGet: jest.Mock;
  let httpService: { get: jest.Mock };

  const readableLike = { __isStream: true };

  const makeGeneration = (
    overrides: Partial<FakeGeneration> = {},
  ): FakeGeneration => ({
    id: generationId,
    memoryPointId,
    status: AiGenerationStatus.PROCESSING,
    attemptNumber: 1,
    didTalkId: talkId,
    toDto: () => ({ id: generationId }),
    ...overrides,
  });

  beforeEach(() => {
    findOneBy = jest.fn<() => Promise<FakeGeneration | null>>();
    save = jest
      .fn<(e: FakeGeneration) => Promise<FakeGeneration>>()
      .mockImplementation(async (e) => e);
    repo = { findOneBy, save };

    getTalk =
      jest.fn<
        () => Promise<{
          id: string;
          status: string;
          resultUrl?: string;
          error?: unknown;
          durationSeconds?: number;
        }>
      >();
    didService = { getTalk };

    uploadStream = jest
      .fn<() => Promise<string>>()
      .mockImplementation(async (path: string) => path);
    gcsService = { uploadStream };

    commandBusExecute = jest
      .fn<() => Promise<unknown>>()
      .mockResolvedValue(undefined);

    httpGet = jest.fn().mockReturnValue(of({ data: readableLike }));
    httpService = { get: httpGet };

    handler = new ProcessDidWebhookHandler(
      repo as never,
      didService as never,
      gcsService as never,
      { execute: commandBusExecute } as never,
      httpService as never,
    );
  });

  it('returns early when no generation is found, without calling getTalk', async () => {
    findOneBy.mockResolvedValue(null);

    await expect(
      handler.execute(new ProcessDidWebhookCommand(talkId)),
    ).resolves.toBeUndefined();

    expect(getTalk).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
    expect(commandBusExecute).not.toHaveBeenCalled();
  });

  it('returns early when generation is already COMPLETED', async () => {
    findOneBy.mockResolvedValue(
      makeGeneration({ status: AiGenerationStatus.COMPLETED }),
    );

    await handler.execute(new ProcessDidWebhookCommand(talkId));

    expect(getTalk).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
    expect(commandBusExecute).not.toHaveBeenCalled();
  });

  it('done + resultUrl: streams + uploads to the result path, sets COMPLETED, dispatches ApplyGenerationResultCommand COMPLETED', async () => {
    const generation = makeGeneration();
    findOneBy.mockResolvedValue(generation);
    getTalk.mockResolvedValue({
      id: talkId,
      status: 'done',
      resultUrl: 'https://did/result.mp4',
      durationSeconds: 12.5,
    });

    await handler.execute(new ProcessDidWebhookCommand(talkId));

    expect(httpGet).toHaveBeenCalledWith('https://did/result.mp4', {
      responseType: 'stream',
    });

    const expectedPath = `generations/${memoryPointId}/${generationId}/result.mp4`;
    expect(uploadStream).toHaveBeenCalledWith(
      expectedPath,
      readableLike,
      'video/mp4',
    );

    expect(generation.status).toBe(AiGenerationStatus.COMPLETED);
    // resultVideoUrl holds D-ID's own file URL; the GCS copy goes to details.
    expect(generation.resultVideoUrl).toBe('https://did/result.mp4');
    expect(generation.durationSeconds).toBe(12.5);
    expect(save).toHaveBeenCalledTimes(1);

    const cmd = commandBusExecute.mock
      .calls[0][0] as ApplyGenerationResultCommand;
    expect(cmd).toBeInstanceOf(ApplyGenerationResultCommand);
    expect(cmd.memoryPointId).toBe(memoryPointId);
    expect(cmd.payload).toEqual({
      status: AiGenerationStatus.COMPLETED,
      videoUrl: expectedPath,
    });
  });

  it('done without durationSeconds: does not set durationSeconds', async () => {
    const generation = makeGeneration();
    findOneBy.mockResolvedValue(generation);
    getTalk.mockResolvedValue({
      id: talkId,
      status: 'done',
      resultUrl: 'https://did/result.mp4',
    });

    await handler.execute(new ProcessDidWebhookCommand(talkId));

    expect(generation.durationSeconds).toBeUndefined();
    expect(generation.status).toBe(AiGenerationStatus.COMPLETED);
  });

  it('error status with error payload: sets FAILED with JSON.stringify(error), dispatches ApplyGenerationResultCommand FAILED', async () => {
    const generation = makeGeneration();
    findOneBy.mockResolvedValue(generation);
    getTalk.mockResolvedValue({
      id: talkId,
      status: 'error',
      error: { kind: 'face_error', description: 'no face' },
    });

    await handler.execute(new ProcessDidWebhookCommand(talkId));

    const expectedMsg = JSON.stringify({
      kind: 'face_error',
      description: 'no face',
    });
    expect(generation.status).toBe(AiGenerationStatus.FAILED);
    expect(generation.errorMessage).toBe(expectedMsg);
    expect(save).toHaveBeenCalledTimes(1);
    expect(uploadStream).not.toHaveBeenCalled();

    const cmd = commandBusExecute.mock
      .calls[0][0] as ApplyGenerationResultCommand;
    expect(cmd).toBeInstanceOf(ApplyGenerationResultCommand);
    expect(cmd.payload).toEqual({
      status: AiGenerationStatus.FAILED,
      errorMessage: expectedMsg,
    });
  });

  it('rejected status without error payload: uses default error message', async () => {
    const generation = makeGeneration();
    findOneBy.mockResolvedValue(generation);
    getTalk.mockResolvedValue({ id: talkId, status: 'rejected' });

    await handler.execute(new ProcessDidWebhookCommand(talkId));

    expect(generation.status).toBe(AiGenerationStatus.FAILED);
    expect(generation.errorMessage).toBe('D-ID generation failed');

    const cmd = commandBusExecute.mock
      .calls[0][0] as ApplyGenerationResultCommand;
    expect(cmd.payload).toEqual({
      status: AiGenerationStatus.FAILED,
      errorMessage: 'D-ID generation failed',
    });
  });

  it('still processing (started): no state change, no save, no command dispatched', async () => {
    const generation = makeGeneration();
    findOneBy.mockResolvedValue(generation);
    getTalk.mockResolvedValue({ id: talkId, status: 'started' });

    await handler.execute(new ProcessDidWebhookCommand(talkId));

    expect(generation.status).toBe(AiGenerationStatus.PROCESSING);
    expect(save).not.toHaveBeenCalled();
    expect(commandBusExecute).not.toHaveBeenCalled();
    expect(uploadStream).not.toHaveBeenCalled();
  });

  it('still processing (created): no state change, no save, no command dispatched', async () => {
    const generation = makeGeneration();
    findOneBy.mockResolvedValue(generation);
    getTalk.mockResolvedValue({ id: talkId, status: 'created' });

    await handler.execute(new ProcessDidWebhookCommand(talkId));

    expect(save).not.toHaveBeenCalled();
    expect(commandBusExecute).not.toHaveBeenCalled();
  });
});
