import { jest } from '@jest/globals';

import { AudioFileType } from '../../../../constants/audio-file-type.ts';
import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { PhotoFileType } from '../../../../constants/photo-file-type.ts';
import type { MemoryPointUploadUrlsDto } from '../../dtos/memory-point-upload-urls.dto.ts';
import { MemoryPointNotEditableException } from '../../exceptions/memory-point-not-editable.exception.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { CreateAdminUploadUrlCommand } from './create-admin-upload-url.command.ts';
import { CreateAdminUploadUrlHandler } from './create-admin-upload-url.handler.ts';

describe('CreateAdminUploadUrlHandler', () => {
  let handler: CreateAdminUploadUrlHandler;

  let getOne: jest.Mock<() => Promise<unknown>>;
  let where: jest.Mock<(clause: string, params: unknown) => unknown>;
  let createQueryBuilder: jest.Mock<() => unknown>;
  let getSignedWriteUrl: jest.Mock<(path: string) => Promise<string>>;
  let uuid: jest.Mock<() => string>;

  const pointId = 'point-1' as Uuid;

  const dto = {
    photoContentType: PhotoFileType.JPG,
    audioContentType: AudioFileType.MP3,
  };

  beforeEach(() => {
    getOne = jest.fn<() => Promise<unknown>>().mockResolvedValue({
      id: pointId,
      status: MemoryPointStatus.ADMIN_REVIEWING,
    });
    where = jest.fn(() => ({ getOne }));
    createQueryBuilder = jest.fn(() => ({ where }));

    let counter = 0;
    uuid = jest.fn(() => {
      counter += 1;

      return `uuid-${counter}`;
    });
    getSignedWriteUrl = jest
      .fn<(path: string) => Promise<string>>()
      .mockImplementation((path: string) => Promise.resolve(`signed:${path}`));

    handler = new CreateAdminUploadUrlHandler(
      { createQueryBuilder } as never,
      { getSignedWriteUrl } as never,
      { uuid } as never,
    );
  });

  const run = (): Promise<MemoryPointUploadUrlsDto> =>
    handler.execute(new CreateAdminUploadUrlCommand(pointId, dto));

  it('returns signed write URLs and object paths without an owner check', async () => {
    const result = await run();

    expect(where).toHaveBeenCalledWith('memoryPoint.id = :id', { id: pointId });
    expect(getSignedWriteUrl).toHaveBeenCalledWith(
      `memory-points/${pointId}/photo/uuid-1.jpg`,
      'image/jpeg',
    );
    expect(getSignedWriteUrl).toHaveBeenCalledWith(
      `memory-points/${pointId}/audio/uuid-2.mp3`,
      'audio/mpeg',
    );
    expect(result.photo).toEqual({
      uploadUrl: `signed:memory-points/${pointId}/photo/uuid-1.jpg`,
      objectPath: `memory-points/${pointId}/photo/uuid-1.jpg`,
    });
    expect(result.audio).toEqual({
      uploadUrl: `signed:memory-points/${pointId}/audio/uuid-2.mp3`,
      objectPath: `memory-points/${pointId}/audio/uuid-2.mp3`,
    });
  });

  it('throws MemoryPointNotFoundException when the memory point does not exist', async () => {
    getOne.mockResolvedValue(null);

    await expect(run()).rejects.toBeInstanceOf(MemoryPointNotFoundException);
    expect(getSignedWriteUrl).not.toHaveBeenCalled();
  });

  it('allows editing a REJECTED point', async () => {
    getOne.mockResolvedValue({
      id: pointId,
      status: MemoryPointStatus.REJECTED,
    });

    await expect(run()).resolves.toBeDefined();
    expect(getSignedWriteUrl).toHaveBeenCalledTimes(2);
  });

  it.each([
    [MemoryPointStatus.PENDING],
    [MemoryPointStatus.GENERATING],
    [MemoryPointStatus.AI_REVIEWING],
    [MemoryPointStatus.APPROVED],
  ])(
    'throws MemoryPointNotEditableException when status is %s',
    async (status) => {
      getOne.mockResolvedValue({ id: pointId, status });

      await expect(run()).rejects.toBeInstanceOf(
        MemoryPointNotEditableException,
      );
      expect(getSignedWriteUrl).not.toHaveBeenCalled();
    },
  );
});
