import { jest } from '@jest/globals';

import { AudioFileType } from '../../../../constants/audio-file-type.ts';
import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { PhotoFileType } from '../../../../constants/photo-file-type.ts';
import type { MemoryPointUploadUrlsDto } from '../../dtos/memory-point-upload-urls.dto.ts';
import { MemoryPointNotEditableException } from '../../exceptions/memory-point-not-editable.exception.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { CreateUploadUrlCommand } from './create-upload-url.command.ts';
import { CreateUploadUrlHandler } from './create-upload-url.handler.ts';

describe('CreateUploadUrlHandler', () => {
  let handler: CreateUploadUrlHandler;

  let getOne: jest.Mock<() => Promise<unknown>>;
  let where: jest.Mock<(clause: string, params: unknown) => unknown>;
  let createQueryBuilder: jest.Mock<() => unknown>;
  let getSignedWriteUrl: jest.Mock<(path: string) => Promise<string>>;
  let uuid: jest.Mock<() => string>;

  const pointId = 'point-1' as Uuid;
  const userId = 'user-1' as Uuid;

  const dto = {
    photoContentType: PhotoFileType.JPG,
    audioContentType: AudioFileType.MP3,
  };

  beforeEach(() => {
    getOne = jest.fn<() => Promise<unknown>>().mockResolvedValue({
      id: pointId,
      userId,
      status: MemoryPointStatus.PENDING,
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

    handler = new CreateUploadUrlHandler(
      { createQueryBuilder } as never,
      { getSignedWriteUrl } as never,
      { uuid } as never,
    );
  });

  const run = (): Promise<MemoryPointUploadUrlsDto> =>
    handler.execute(new CreateUploadUrlCommand(pointId, userId, dto));

  it('returns signed write URLs and object paths for photo and audio', async () => {
    const result = await run();

    expect(where).toHaveBeenCalledWith('memoryPoint.id = :id', { id: pointId });
    /*
     * The object path ends in the file-type extension (D-ID validates the URL
     * suffix), while the URL is signed with the real MIME type (the browser
     * PUTs the file with that Content-Type header).
     */
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

  it('maps PNG and WAV file types to their MIME types when signing', async () => {
    await handler.execute(
      new CreateUploadUrlCommand(pointId, userId, {
        photoContentType: PhotoFileType.PNG,
        audioContentType: AudioFileType.WAV,
      }),
    );

    expect(getSignedWriteUrl).toHaveBeenCalledWith(
      `memory-points/${pointId}/photo/uuid-1.png`,
      'image/png',
    );
    expect(getSignedWriteUrl).toHaveBeenCalledWith(
      `memory-points/${pointId}/audio/uuid-2.wav`,
      'audio/wav',
    );
  });

  it('throws MemoryPointNotFoundException when the memory point does not exist', async () => {
    getOne.mockResolvedValue(null);

    await expect(run()).rejects.toBeInstanceOf(MemoryPointNotFoundException);
    expect(getSignedWriteUrl).not.toHaveBeenCalled();
  });

  it('throws MemoryPointNotFoundException when the memory point belongs to another user', async () => {
    getOne.mockResolvedValue({
      id: pointId,
      userId: 'someone-else' as Uuid,
      status: MemoryPointStatus.PENDING,
    });

    await expect(run()).rejects.toBeInstanceOf(MemoryPointNotFoundException);
    expect(getSignedWriteUrl).not.toHaveBeenCalled();
  });

  it('throws MemoryPointNotEditableException when the point is not PENDING', async () => {
    getOne.mockResolvedValue({
      id: pointId,
      userId,
      status: MemoryPointStatus.ADMIN_REVIEWING,
    });

    await expect(run()).rejects.toBeInstanceOf(MemoryPointNotEditableException);
    expect(getSignedWriteUrl).not.toHaveBeenCalled();
  });
});
