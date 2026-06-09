/** biome-ignore-all lint/style/useNamingConvention: test fixture interface name */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { AiGenerationStatus } from '../../../../constants/ai-generation-status.ts';
import { ApplyGenerationResultCommand } from '../../../memory-points/commands/apply-generation-result/apply-generation-result.command.ts';
import { MarkGenerationStartedCommand } from '../../../memory-points/commands/mark-generation-started/mark-generation-started.command.ts';
import { GetMemoryPointGenerationSourceQuery } from '../../../memory-points/queries/get-memory-point-generation-source/get-memory-point-generation-source.query.ts';
import { AiGenerationFailedException } from '../../exceptions/ai-generation-failed.exception.ts';
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
  const signedAudioUrl = 'https://signed/audio';
  const didSourceUrl = 's3://d-id-images/source.jpg';
  // Minimal JPEG magic bytes — passes through normalization untouched.
  const photoBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);

  let handler: CreateAiGenerationHandler;
  let getOne: jest.Mock<() => Promise<FakeGeneration | null>>;
  let create: jest.Mock;
  let save: jest.Mock<(e: FakeGeneration) => Promise<FakeGeneration>>;
  let repo: {
    createQueryBuilder: jest.Mock;
    create: jest.Mock;
    save: typeof save;
  };
  let createTalk: jest.Mock<() => Promise<{ id: string; status: string }>>;
  let uploadImage: jest.Mock<
    (image: Buffer, filename: string) => Promise<string>
  >;
  let didService: {
    createTalk: typeof createTalk;
    uploadImage: typeof uploadImage;
  };
  let getSignedReadUrl: jest.Mock<(p: string) => Promise<string>>;
  let download: jest.Mock<(p: string) => Promise<Buffer>>;
  let gcsService: {
    getSignedReadUrl: typeof getSignedReadUrl;
    download: typeof download;
  };
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
    getOne = jest.fn<() => Promise<FakeGeneration | null>>();
    create = jest.fn();
    save = jest
      .fn<(e: FakeGeneration) => Promise<FakeGeneration>>()
      .mockImplementation((e) => Promise.resolve(e));
    repo = {
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        getOne,
      })),
      create,
      save,
    };

    createTalk = jest
      .fn<() => Promise<{ id: string; status: string }>>()
      .mockResolvedValue({ id: 'talk-123', status: 'created' });
    uploadImage = jest
      .fn<(image: Buffer, filename: string) => Promise<string>>()
      .mockResolvedValue(didSourceUrl);
    didService = { createTalk, uploadImage };

    getSignedReadUrl = jest
      .fn<(p: string) => Promise<string>>()
      .mockResolvedValue(signedAudioUrl);
    download = jest
      .fn<(p: string) => Promise<Buffer>>()
      .mockResolvedValue(photoBuffer);
    gcsService = { getSignedReadUrl, download };

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
    getOne.mockResolvedValue(null);
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
    getOne.mockResolvedValue(null);
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
    getOne.mockResolvedValue(existing);

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
    getOne.mockResolvedValue(existing);

    await handler.execute(new CreateAiGenerationCommand(memoryPointId));

    expect(create).not.toHaveBeenCalled();
    expect(existing.attemptNumber).toBe(1);
  });

  it('happy path: downloads + uploads source image to D-ID, signs audio, creates talk, sets PROCESSING, returns dto', async () => {
    const created = makeGeneration();
    getOne.mockResolvedValue(null);
    create.mockReturnValue(created);

    const result = await handler.execute(
      new CreateAiGenerationCommand(memoryPointId),
    );

    // photo is downloaded (for normalization), audio is signed
    expect(download).toHaveBeenCalledWith(sourcePhotoUrl);
    expect(getSignedReadUrl).toHaveBeenCalledWith(sourceAudioUrl);
    expect(getSignedReadUrl).not.toHaveBeenCalledWith(sourcePhotoUrl);

    // normalized image bytes uploaded to D-ID under the generation id
    expect(uploadImage).toHaveBeenCalledWith(
      photoBuffer,
      `${generationId}.jpg`,
    );

    expect(createTalk).toHaveBeenCalledWith({
      sourceUrl: didSourceUrl,
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

  it('failure path: createTalk throws -> FAILED + provider errorMessage, dispatches ApplyGenerationResult, throws coded exception', async () => {
    const created = makeGeneration();
    getOne.mockResolvedValue(null);
    create.mockReturnValue(created);

    const boom = new Error('did exploded');
    createTalk.mockRejectedValue(boom);

    // surfaces a stable error code (ADR-0015), not the raw provider error
    await expect(
      handler.execute(new CreateAiGenerationCommand(memoryPointId)),
    ).rejects.toBeInstanceOf(AiGenerationFailedException);

    expect(created.status).toBe(AiGenerationStatus.FAILED);
    // the raw provider detail is still persisted for diagnostics
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

  it('failure path: a gcs download error is also handled and surfaced as a coded exception', async () => {
    const created = makeGeneration();
    getOne.mockResolvedValue(null);
    create.mockReturnValue(created);

    download.mockRejectedValue(new Error('gcs down'));

    await expect(
      handler.execute(new CreateAiGenerationCommand(memoryPointId)),
    ).rejects.toBeInstanceOf(AiGenerationFailedException);

    expect(created.status).toBe(AiGenerationStatus.FAILED);
    expect(created.errorMessage).toBe('gcs down');
    expect(uploadImage).not.toHaveBeenCalled();
    expect(createTalk).not.toHaveBeenCalled();
  });
});
