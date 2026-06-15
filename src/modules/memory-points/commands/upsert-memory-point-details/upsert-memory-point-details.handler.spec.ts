import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { MemoryPointType } from '../../../../constants/memory-point-type.ts';
import { MemoryPointContentRequiredException } from '../../exceptions/memory-point-content-required.exception.ts';
import { MemoryPointNotEditableException } from '../../exceptions/memory-point-not-editable.exception.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { MemoryPointSourceNotUploadedException } from '../../exceptions/memory-point-source-not-uploaded.exception.ts';
import { UpsertMemoryPointDetailsCommand } from './upsert-memory-point-details.command.ts';

/*
 * The handler is decorated with @Transactional(), which requires an initialized
 * transactional context that does not exist in a plain unit test. Stub it out to
 * a no-op so we can exercise the handler logic directly.
 */
const noopTransactionalDecorator = (): void => {
  // no-op @Transactional decorator stub for unit tests
};

jest.unstable_mockModule('typeorm-transactional', () => ({
  // biome-ignore lint/style/useNamingConvention: mocks the PascalCase @Transactional decorator
  Transactional: () => noopTransactionalDecorator,
}));

const handlerModule = await import('./upsert-memory-point-details.handler.ts');

describe('UpsertMemoryPointDetailsHandler', () => {
  let handler: InstanceType<
    typeof handlerModule.UpsertMemoryPointDetailsHandler
  >;

  let getOne: jest.Mock<() => Promise<unknown>>;
  let memoryPointWhere: jest.Mock;
  let memoryPointCreateQueryBuilder: jest.Mock;
  let create: jest.Mock;
  let upsert: jest.Mock;
  let getOneOrFail: jest.Mock<() => Promise<unknown>>;
  let detailsWhere: jest.Mock;
  let detailsCreateQueryBuilder: jest.Mock;

  let exists: jest.Mock<(path: string) => Promise<boolean>>;

  let updateStatus: jest.Mock<() => Promise<unknown>>;
  let memoryPointRepo: { createQueryBuilder: jest.Mock; update: jest.Mock };
  let detailsRepo: {
    create: jest.Mock;
    upsert: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let gcsStorageService: {
    exists: jest.Mock<(path: string) => Promise<boolean>>;
  };

  const pointId = 'point-1' as Uuid;
  const userId = 'user-1' as Uuid;

  const dto = {
    sourcePhotoUrl: `memory-points/${pointId}/photo/abc.jpg`,
    sourceAudioUrl: `memory-points/${pointId}/audio/abc.mp3`,
    title: 'A title',
    description: 'A description',
    cloudAnchorId: 'anchor-1',
    type: MemoryPointType.GRAVE,
  };

  const detailsDto = { id: 'details-1' };

  beforeEach(() => {
    getOne = jest.fn<() => Promise<unknown>>().mockResolvedValue({
      id: pointId,
      userId,
      status: MemoryPointStatus.PENDING,
    });
    memoryPointWhere = jest.fn().mockReturnValue({ getOne });
    memoryPointCreateQueryBuilder = jest
      .fn()
      .mockReturnValue({ where: memoryPointWhere });

    create = jest.fn((entity: unknown) => entity);
    upsert = jest.fn<() => Promise<void>>().mockResolvedValue();
    getOneOrFail = jest.fn<() => Promise<unknown>>().mockResolvedValue({
      memoryPointId: pointId,
      toDto: () => detailsDto,
    });
    detailsWhere = jest.fn().mockReturnValue({ getOneOrFail });
    detailsCreateQueryBuilder = jest
      .fn()
      .mockReturnValue({ where: detailsWhere });

    exists = jest
      .fn<(path: string) => Promise<boolean>>()
      .mockResolvedValue(true);

    updateStatus = jest
      .fn<() => Promise<unknown>>()
      .mockResolvedValue({ affected: 1 });
    memoryPointRepo = {
      createQueryBuilder: memoryPointCreateQueryBuilder,
      update: updateStatus,
    };
    detailsRepo = {
      create,
      upsert,
      createQueryBuilder: detailsCreateQueryBuilder,
    };
    gcsStorageService = { exists };

    handler = new handlerModule.UpsertMemoryPointDetailsHandler(
      memoryPointRepo as never,
      detailsRepo as never,
      gcsStorageService as never,
    );
  });

  const run = (): ReturnType<typeof handler.execute> =>
    handler.execute(new UpsertMemoryPointDetailsCommand(pointId, userId, dto));

  it('upserts details, moves the point to ADMIN_REVIEWING and returns the details DTO', async () => {
    const result = await run();

    expect(memoryPointWhere).toHaveBeenCalledWith('memoryPoint.id = :id', {
      id: pointId,
    });
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
    expect(exists).toHaveBeenCalledWith(dto.sourcePhotoUrl);
    expect(exists).toHaveBeenCalledWith(dto.sourceAudioUrl);
    expect(upsert).toHaveBeenCalledWith(expect.anything(), ['memoryPointId']);
    expect(updateStatus).toHaveBeenCalledWith(
      { id: pointId },
      { status: MemoryPointStatus.ADMIN_REVIEWING },
    );
    expect(detailsWhere).toHaveBeenCalledWith(
      'details.memoryPointId = :memoryPointId',
      { memoryPointId: pointId },
    );
    expect(result).toBe(detailsDto);
  });

  it('allows a text-only submit (title + description, no media)', async () => {
    const textOnly = await handler.execute(
      new UpsertMemoryPointDetailsCommand(pointId, userId, {
        title: 'A title',
        description: 'A description',
      }),
    );

    // No source paths provided -> storage is never probed.
    expect(exists).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'A title',
        description: 'A description',
        memoryPointId: pointId,
      }),
    );
    // Omitted source columns are not part of the upserted object (preserved).
    const created = create.mock.calls[0]![0] as Record<string, unknown>;
    expect(created).not.toHaveProperty('sourcePhotoUrl');
    expect(created).not.toHaveProperty('sourceAudioUrl');
    expect(upsert).toHaveBeenCalledWith(expect.anything(), ['memoryPointId']);
    expect(updateStatus).toHaveBeenCalledWith(
      { id: pointId },
      { status: MemoryPointStatus.ADMIN_REVIEWING },
    );
    expect(textOnly).toBe(detailsDto);
  });

  it('treats blank source paths as omitted (normalized, not probed or persisted)', async () => {
    await handler.execute(
      new UpsertMemoryPointDetailsCommand(pointId, userId, {
        title: 'A title',
        description: 'Has content',
        sourcePhotoUrl: '',
        sourceAudioUrl: '   ',
      }),
    );

    // Blank paths are normalized away -> storage is never probed.
    expect(exists).not.toHaveBeenCalled();
    const created = create.mock.calls[0]![0] as Record<string, unknown>;
    expect(created).not.toHaveProperty('sourcePhotoUrl');
    expect(created).not.toHaveProperty('sourceAudioUrl');
    expect(upsert).toHaveBeenCalledWith(expect.anything(), ['memoryPointId']);
  });

  it('throws MemoryPointContentRequiredException when blank paths leave no content', async () => {
    await expect(
      handler.execute(
        new UpsertMemoryPointDetailsCommand(pointId, userId, {
          title: 'A title',
          sourcePhotoUrl: '',
          sourceAudioUrl: '',
        }),
      ),
    ).rejects.toBeInstanceOf(MemoryPointContentRequiredException);
    expect(exists).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it('throws MemoryPointContentRequiredException when only a title is provided', async () => {
    await expect(
      handler.execute(
        new UpsertMemoryPointDetailsCommand(pointId, userId, {
          title: 'Just a title',
        }),
      ),
    ).rejects.toBeInstanceOf(MemoryPointContentRequiredException);
    expect(exists).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it('allows a photo-only submit (no audio, no description)', async () => {
    exists.mockResolvedValue(true);

    await handler.execute(
      new UpsertMemoryPointDetailsCommand(pointId, userId, {
        title: 'A title',
        sourcePhotoUrl: `memory-points/${pointId}/photo/abc.jpg`,
      }),
    );

    expect(exists).toHaveBeenCalledWith(
      `memory-points/${pointId}/photo/abc.jpg`,
    );
    expect(exists).toHaveBeenCalledTimes(1); // audio never probed
    expect(upsert).toHaveBeenCalledWith(expect.anything(), ['memoryPointId']);
  });

  it('rejects a source path that belongs to another memory point', async () => {
    const crossPointDto = {
      ...dto,
      sourcePhotoUrl: 'memory-points/other-point/photo/abc.jpg',
    };

    await expect(
      handler.execute(
        new UpsertMemoryPointDetailsCommand(pointId, userId, crossPointDto),
      ),
    ).rejects.toBeInstanceOf(MemoryPointSourceNotUploadedException);
    // Ownership is enforced before touching storage or persisting anything.
    expect(exists).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it('throws MemoryPointSourceNotUploadedException when a file is missing', async () => {
    exists.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    await expect(run()).rejects.toBeInstanceOf(
      MemoryPointSourceNotUploadedException,
    );
    expect(upsert).not.toHaveBeenCalled();
  });

  it('throws MemoryPointNotFoundException when the memory point does not exist', async () => {
    getOne.mockResolvedValue(null);

    await expect(run()).rejects.toBeInstanceOf(MemoryPointNotFoundException);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('throws MemoryPointNotFoundException when the memory point belongs to another user', async () => {
    getOne.mockResolvedValue({
      id: pointId,
      userId: 'someone-else' as Uuid,
      status: MemoryPointStatus.PENDING,
    });

    await expect(run()).rejects.toBeInstanceOf(MemoryPointNotFoundException);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('throws MemoryPointNotEditableException once the point is under review (ADMIN_REVIEWING)', async () => {
    getOne.mockResolvedValue({
      id: pointId,
      userId,
      status: MemoryPointStatus.ADMIN_REVIEWING,
    });

    await expect(run()).rejects.toBeInstanceOf(MemoryPointNotEditableException);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('lets a REJECTED point be re-submitted and re-enters ADMIN_REVIEWING', async () => {
    getOne.mockResolvedValue({
      id: pointId,
      userId,
      status: MemoryPointStatus.REJECTED,
    });

    const result = await run();

    expect(upsert).toHaveBeenCalledWith(expect.anything(), ['memoryPointId']);
    expect(updateStatus).toHaveBeenCalledWith(
      { id: pointId },
      { status: MemoryPointStatus.ADMIN_REVIEWING },
    );
    expect(result).toBe(detailsDto);
  });
});
