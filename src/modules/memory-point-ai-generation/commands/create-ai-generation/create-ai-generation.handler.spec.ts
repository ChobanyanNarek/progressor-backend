import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { AiGenerationStatus } from '../../../../constants/ai-generation-status.ts';
import { ApplyGenerationResultCommand } from '../../../memory-points/commands/apply-generation-result/apply-generation-result.command.ts';
import { MarkGenerationStartedCommand } from '../../../memory-points/commands/mark-generation-started/mark-generation-started.command.ts';
import { GetMemoryPointGenerationSourceQuery } from '../../../memory-points/queries/get-memory-point-generation-source/get-memory-point-generation-source.query.ts';
import { CreateAiGenerationCommand } from './create-ai-generation.command.ts';
import { CreateAiGenerationHandler } from './create-ai-generation.handler.ts';

interface FakeGeneration {
  id: Uuid;
  memoryPointId: Uuid;
  status: AiGenerationStatus;
  attemptNumber: number;
  didTalkId?: string;
  resultVideoUrl?: string;
  errorMessage?: string;
  userData?: string;
  durationSeconds?: number;
  toDto: () => Record<string, unknown>;
}

describe('CreateAiGenerationHandler', () => {
  const memoryPointId = 'point-1' as Uuid;
  const generationId = 'gen-1' as Uuid;
  const sourcePhotoUrl = 'gs://bucket/photo.jpg';
  const sourceAudioUrl = 'gs://bucket/audio.mp3';
  const signedPhotoUrl = 'https://signed/photo';
  const signedAudioUrl = 'https://signed/audio';

  let handler: CreateAiGenerationHandler;
  let findOneBy: jest.Mock<() => Promise<FakeGeneration | null>>;
  let create: jest.Mock;
  let save: jest.Mock<(e: FakeGeneration) => Promise<FakeGeneration>>;
  let repo: {
    findOneBy: typeof findOneBy;
    create: jest.Mock;
    save: typeof save;
  };
  let createTalk: jest.Mock<() => Promise<{ id: string; status: string }>>;
  let didService: { createTalk: typeof createTalk };
  let getSignedReadUrl: jest.Mock<(p: string) => Promise<string>>;
  let gcsService: { getSignedReadUrl: typeof getSignedReadUrl };
  let commandBusExecute: jest.Mock<(command: unknown) => Promise<unknown>>;
  let queryBusExecute: jest.Mock<(query: unknown) => Promise<unknown>>;

  const makeGeneration = (
    overrides: Partial<FakeGeneration> = {},
  ): FakeGeneration => {
    const gen: FakeGeneration = {
      id: generationId,
      memoryPointId,
      status: AiGenerationStatus.PENDING,
      attemptNumber: 1,
      toDto: () => ({ id: generationId, memoryPointId }),
      ...overrides,
    };

    return gen;
  };

  beforeEach(() => {
    findOneBy = jest.fn<() => Promise<FakeGeneration | null>>();
    create = jest.fn();
    save = jest
      .fn<(e: FakeGeneration) => Promise<FakeGeneration>>()
      .mockImplementation((e) => Promise.resolve(e));
    repo = { findOneBy, create, save };

    createTalk = jest
      .fn<() => Promise<{ id: string; status: string }>>()
      .mockResolvedValue({ id: 'talk-123', status: 'created' });
    didService = { createTalk };

    getSignedReadUrl = jest
      .fn<(p: string) => Promise<string>>()
      .mockImplementation((p) =>
        Promise.resolve(p === sourcePhotoUrl ? signedPhotoUrl : signedAudioUrl),
      );
    gcsService = { getSignedReadUrl };

    commandBusExecute = jest.fn<(command: unknown) => Promise<unknown>>();
    queryBusExecute = jest
      .fn<(query: unknown) => Promise<unknown>>()
      .mockResolvedValue({ sourcePhotoUrl, sourceAudioUrl });

    handler = new CreateAiGenerationHandler(
      repo as never,
      didService as never,
      gcsService as never,
      { execute: commandBusExecute } as never,
      { execute: queryBusExecute } as never,
    );
  });

  it('queries the memory point generation source first', async () => {
    const created = makeGeneration();
    findOneBy.mockResolvedValue(null);
    create.mockReturnValue(created);

    await handler.execute(new CreateAiGenerationCommand(memoryPointId));

    expect(queryBusExecute).toHaveBeenCalledTimes(1);
    const query = queryBusExecute.mock.calls[0]![0];
    expect(query).toBeInstanceOf(GetMemoryPointGenerationSourceQuery);
    expect((query as GetMemoryPointGenerationSourceQuery).memoryPointId).toBe(
      memoryPointId,
    );
  });

  it('creates a new PENDING generation with attemptNumber 1 when none exists', async () => {
    const created = makeGeneration();
    findOneBy.mockResolvedValue(null);
    create.mockReturnValue(created);

    await handler.execute(new CreateAiGenerationCommand(memoryPointId));

    expect(create).toHaveBeenCalledWith({
      memoryPointId,
      status: AiGenerationStatus.PENDING,
      attemptNumber: 1,
    });
    // first save persists the PENDING generation
    expect(save).toHaveBeenCalled();
  });

  it('increments attemptNumber and resets a non-PENDING (FAILED) existing generation', async () => {
    const existing = makeGeneration({
      status: AiGenerationStatus.FAILED,
      attemptNumber: 2,
      didTalkId: 'old-talk',
      resultVideoUrl: 'old-video',
      errorMessage: 'old error',
    });
    findOneBy.mockResolvedValue(existing);

    await handler.execute(new CreateAiGenerationCommand(memoryPointId));

    expect(create).not.toHaveBeenCalled();
    expect(existing.attemptNumber).toBe(3);
    /*
     * status ends PROCESSING after success, but was reset to PENDING first;
     * the reset side effects on the cleared fields persist:
     */
    expect(existing.didTalkId).toBe('talk-123'); // set by createTalk success
    expect(existing.resultVideoUrl).toBeUndefined();
    expect(existing.errorMessage).toBeUndefined();
  });

  it('reuses an already PENDING existing generation without incrementing attemptNumber', async () => {
    const existing = makeGeneration({
      status: AiGenerationStatus.PENDING,
      attemptNumber: 1,
    });
    findOneBy.mockResolvedValue(existing);

    await handler.execute(new CreateAiGenerationCommand(memoryPointId));

    expect(create).not.toHaveBeenCalled();
    expect(existing.attemptNumber).toBe(1);
  });

  it('happy path: signs both urls, creates talk, sets PROCESSING, dispatches MarkGenerationStarted, returns dto', async () => {
    const created = makeGeneration();
    findOneBy.mockResolvedValue(null);
    create.mockReturnValue(created);

    const result = await handler.execute(
      new CreateAiGenerationCommand(memoryPointId),
    );

    expect(getSignedReadUrl).toHaveBeenCalledWith(sourcePhotoUrl);
    expect(getSignedReadUrl).toHaveBeenCalledWith(sourceAudioUrl);

    expect(createTalk).toHaveBeenCalledWith({
      sourceUrl: signedPhotoUrl,
      audioUrl: signedAudioUrl,
      userData: generationId,
    });

    expect(created.didTalkId).toBe('talk-123');
    expect(created.userData).toBe(generationId);
    expect(created.status).toBe(AiGenerationStatus.PROCESSING);

    // saved twice: once PENDING, once PROCESSING
    expect(save).toHaveBeenCalledTimes(2);

    const startedCmd = commandBusExecute.mock.calls[0]![0];
    expect(startedCmd).toBeInstanceOf(MarkGenerationStartedCommand);
    expect((startedCmd as MarkGenerationStartedCommand).memoryPointId).toBe(
      memoryPointId,
    );

    expect(result).toEqual({ id: generationId, memoryPointId });
  });

  it('failure path: createTalk throws -> sets FAILED + errorMessage, dispatches ApplyGenerationResultCommand FAILED, re-throws', async () => {
    const created = makeGeneration();
    findOneBy.mockResolvedValue(null);
    create.mockReturnValue(created);

    const boom = new Error('did exploded');
    createTalk.mockRejectedValue(boom);

    await expect(
      handler.execute(new CreateAiGenerationCommand(memoryPointId)),
    ).rejects.toThrow('did exploded');

    expect(created.status).toBe(AiGenerationStatus.FAILED);
    expect(created.errorMessage).toBe('did exploded');

    const applyCmd = commandBusExecute.mock.calls.find(
      (c) => c[0] instanceof ApplyGenerationResultCommand,
    )?.[0] as ApplyGenerationResultCommand;
    expect(applyCmd).toBeDefined();
    expect(applyCmd.memoryPointId).toBe(memoryPointId);
    expect(applyCmd.payload).toEqual({
      status: AiGenerationStatus.FAILED,
      errorMessage: 'did exploded',
    });

    // MarkGenerationStartedCommand must NOT have been dispatched
    expect(
      commandBusExecute.mock.calls.some(
        (c) => c[0] instanceof MarkGenerationStartedCommand,
      ),
    ).toBe(false);
  });

  it('failure path: a gcs signing error is also handled and re-thrown', async () => {
    const created = makeGeneration();
    findOneBy.mockResolvedValue(null);
    create.mockReturnValue(created);

    getSignedReadUrl.mockRejectedValue(new Error('gcs down'));

    await expect(
      handler.execute(new CreateAiGenerationCommand(memoryPointId)),
    ).rejects.toThrow('gcs down');

    expect(created.status).toBe(AiGenerationStatus.FAILED);
    expect(created.errorMessage).toBe('gcs down');
    expect(createTalk).not.toHaveBeenCalled();
  });
});
