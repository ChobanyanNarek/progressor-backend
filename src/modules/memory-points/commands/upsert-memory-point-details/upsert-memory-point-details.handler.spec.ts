import { jest } from '@jest/globals';

import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { MemoryPointType } from '../../../../constants/memory-point-type.ts';
import { MemoryPointNotEditableException } from '../../exceptions/memory-point-not-editable.exception.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { MemoryPointSourceNotUploadedException } from '../../exceptions/memory-point-source-not-uploaded.exception.ts';
import { UpsertMemoryPointDetailsCommand } from './upsert-memory-point-details.command.ts';

// The handler is decorated with @Transactional(), which requires an initialized
// transactional context that does not exist in a plain unit test. Stub it out to
// a no-op so we can exercise the handler logic directly.
jest.unstable_mockModule('typeorm-transactional', () => ({
  Transactional: () => () => undefined,
}));

const { UpsertMemoryPointDetailsHandler } = await import(
  './upsert-memory-point-details.handler.ts'
  );

describe('UpsertMemoryPointDetailsHandler', () => {
  let handler: InstanceType<typeof UpsertMemoryPointDetailsHandler>;

  let findOneBy: jest.Mock;
  let memoryPointUpdate: jest.Mock;
  let create: jest.Mock;
  let upsert: jest.Mock;
  let findOneByOrFail: jest.Mock;
  let exists: jest.Mock;

  let memoryPointRepo: { findOneBy: jest.Mock; update: jest.Mock };
  let detailsRepo: {
    create: jest.Mock;
    upsert: jest.Mock;
    findOneByOrFail: jest.Mock;
  };
  let gcsStorageService: { exists: jest.Mock };

  const pointId = 'point-1' as Uuid;
  const userId = 'user-1' as Uuid;

  const dto = {
    sourcePhotoUrl: 'gcs/photo.jpg',
    sourceAudioUrl: 'gcs/audio.mp3',
    title: 'A title',
    description: 'A description',
    cloudAnchorId: 'anchor-1',
    type: MemoryPointType.GRAVE,
  };

  const detailsDto = { id: 'details-1' };

  beforeEach(() => {
    findOneBy = jest.fn<() => Promise<unknown>>().mockResolvedValue({
      id: pointId,
      userId,
      status: MemoryPointStatus.PENDING,
    });
    memoryPointUpdate = jest
      .fn<() => Promise<unknown>>()
      .mockResolvedValue({ affected: 1 });

    create = jest.fn((entity: unknown) => entity);
    upsert = jest.fn<() => Promise<unknown>>().mockResolvedValue(undefined);
    findOneByOrFail = jest.fn<() => Promise<unknown>>().mockResolvedValue({
      memoryPointId: pointId,
      toDto: () => detailsDto,
    });
    exists = jest.fn<() => Promise<boolean>>().mockResolvedValue(true);

    memoryPointRepo = { findOneBy, update: memoryPointUpdate };
    detailsRepo = { create, upsert, findOneByOrFail };
    gcsStorageService = { exists };

    handler = new UpsertMemoryPointDetailsHandler(
      memoryPointRepo as never,
      detailsRepo as never,
      gcsStorageService as never,
    );
  });

  const run = () =>
    handler.execute(
      new UpsertMemoryPointDetailsCommand(pointId, userId, dto),
    );

  it('upserts details, keeps the point PENDING and returns the details DTO', async () => {
    const result = await run();

    expect(exists).toHaveBeenCalledWith(dto.sourcePhotoUrl);
    expect(exists).toHaveBeenCalledWith(dto.sourceAudioUrl);
    expect(findOneBy).toHaveBeenCalledWith({ id: pointId });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: dto.title,
        description: dto.description,
        cloudAnchorId: dto.cloudAnchorId,
        type: dto.type,
        sourcePhotoUrl: dto.sourcePhotoUrl,
        sourceAudioUrl: dto.sourceAudioUrl,
        memoryPointId: pointId,
      }),
    );
    expect(upsert).toHaveBeenCalledWith(expect.anything(), ['memoryPointId']);
    expect(findOneByOrFail).toHaveBeenCalledWith({ memoryPointId: pointId });
    // Status is left untouched — the admin advances it manually later.
    expect(memoryPointUpdate).not.toHaveBeenCalled();
    expect(result).toBe(detailsDto);
  });

  it('throws MemoryPointNotFoundException when the memory point does not exist', async () => {
    findOneBy.mockResolvedValue(null);

    await expect(run()).rejects.toBeInstanceOf(MemoryPointNotFoundException);
    expect(upsert).not.toHaveBeenCalled();
    expect(memoryPointUpdate).not.toHaveBeenCalled();
  });

  it('throws MemoryPointNotFoundException when the memory point belongs to another user', async () => {
    findOneBy.mockResolvedValue({
      id: pointId,
      userId: 'someone-else' as Uuid,
      status: MemoryPointStatus.PENDING,
    });

    await expect(run()).rejects.toBeInstanceOf(MemoryPointNotFoundException);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('throws MemoryPointNotEditableException when the point is not PENDING', async () => {
    findOneBy.mockResolvedValue({
      id: pointId,
      userId,
      status: MemoryPointStatus.ADMIN_REVIEWING,
    });

    await expect(run()).rejects.toBeInstanceOf(MemoryPointNotEditableException);
    expect(upsert).not.toHaveBeenCalled();
    expect(memoryPointUpdate).not.toHaveBeenCalled();
  });

  it('throws MemoryPointSourceNotUploadedException when the photo is missing in storage', async () => {
    exists.mockImplementation((path: string) =>
      Promise.resolve(path !== dto.sourcePhotoUrl),
    );

    await expect(run()).rejects.toBeInstanceOf(
      MemoryPointSourceNotUploadedException,
    );
    expect(upsert).not.toHaveBeenCalled();
  });

  it('throws MemoryPointSourceNotUploadedException when the audio is missing in storage', async () => {
    exists.mockImplementation((path: string) =>
      Promise.resolve(path !== dto.sourceAudioUrl),
    );

    await expect(run()).rejects.toBeInstanceOf(
      MemoryPointSourceNotUploadedException,
    );
    expect(upsert).not.toHaveBeenCalled();
  });
});
