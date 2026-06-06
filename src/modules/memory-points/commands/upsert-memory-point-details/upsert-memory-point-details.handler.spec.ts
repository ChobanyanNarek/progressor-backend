import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { MemoryPointType } from '../../../../constants/memory-point-type.ts';
import { MemoryPointNotEditableException } from '../../exceptions/memory-point-not-editable.exception.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
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

  let memoryPointRepo: { createQueryBuilder: jest.Mock };
  let detailsRepo: {
    create: jest.Mock;
    upsert: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

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

    memoryPointRepo = { createQueryBuilder: memoryPointCreateQueryBuilder };
    detailsRepo = {
      create,
      upsert,
      createQueryBuilder: detailsCreateQueryBuilder,
    };

    handler = new handlerModule.UpsertMemoryPointDetailsHandler(
      memoryPointRepo as never,
      detailsRepo as never,
    );
  });

  const run = (): ReturnType<typeof handler.execute> =>
    handler.execute(new UpsertMemoryPointDetailsCommand(pointId, userId, dto));

  it('upserts details, keeps the point PENDING and returns the details DTO', async () => {
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
    expect(upsert).toHaveBeenCalledWith(expect.anything(), ['memoryPointId']);
    expect(detailsWhere).toHaveBeenCalledWith(
      'details.memoryPointId = :memoryPointId',
      { memoryPointId: pointId },
    );
    expect(result).toBe(detailsDto);
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

  it('throws MemoryPointNotEditableException when the point is not PENDING', async () => {
    getOne.mockResolvedValue({
      id: pointId,
      userId,
      status: MemoryPointStatus.ADMIN_REVIEWING,
    });

    await expect(run()).rejects.toBeInstanceOf(MemoryPointNotEditableException);
    expect(upsert).not.toHaveBeenCalled();
  });
});
