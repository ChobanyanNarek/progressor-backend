import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { AudioFileType } from '../../../constants/audio-file-type.ts';
import { PhotoFileType } from '../../../constants/photo-file-type.ts';
import { RoleType } from '../../../constants/role-type.ts';
import { CreatorMemoryPointController } from './creator-memory-point.controller.ts';

const VALID_UUID = '0190f8e2-0000-4000-8000-000000000000' as Uuid;

const user: { id: Uuid; role: RoleType } = {
  id: 'user-1' as Uuid,
  role: RoleType.CREATOR,
};

describe('CreatorMemoryPointController', () => {
  type ServiceMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;

  let memoryPointService: {
    createMemoryPoint: ServiceMock;
    createUploadUrls: ServiceMock;
    upsertDetails: ServiceMock;
    getMyMemoryPoints: ServiceMock;
    getMemoryPoint: ServiceMock;
  };
  let controller: CreatorMemoryPointController;

  beforeEach(() => {
    memoryPointService = {
      createMemoryPoint: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      createUploadUrls: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      upsertDetails: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      getMyMemoryPoints: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      getMemoryPoint: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    };
    controller = new CreatorMemoryPointController(memoryPointService as never);
  });

  describe('create', () => {
    it('delegates to createMemoryPoint with user id and dto', async () => {
      const dto = { foo: 'bar' } as never;
      const expected = { id: VALID_UUID };
      memoryPointService.createMemoryPoint.mockResolvedValue(expected);

      const result = await controller.create({ id: 'user-1' } as never, dto);

      expect(memoryPointService.createMemoryPoint).toHaveBeenCalledTimes(1);
      expect(memoryPointService.createMemoryPoint).toHaveBeenCalledWith(
        'user-1',
        dto,
      );
      expect(result).toBe(expected);
    });
  });

  describe('upsertDetails', () => {
    it('delegates to upsertDetails with id, user id and dto', async () => {
      const dto = { title: 'x' } as never;
      const expected = { id: 'details-1' };
      memoryPointService.upsertDetails.mockResolvedValue(expected);

      const result = await controller.upsertDetails(
        VALID_UUID,
        { id: 'user-1' } as never,
        dto,
      );

      expect(memoryPointService.upsertDetails).toHaveBeenCalledTimes(1);
      expect(memoryPointService.upsertDetails).toHaveBeenCalledWith(
        VALID_UUID,
        'user-1',
        dto,
      );
      expect(result).toBe(expected);
    });
  });

  describe('createUploadUrls', () => {
    it('delegates to createUploadUrls with id, user id and dto', async () => {
      const dto = {
        photoContentType: PhotoFileType.JPG,
        audioContentType: AudioFileType.MP3,
      } as never;
      const expected = {
        photo: { uploadUrl: 'u1', objectPath: 'p1' },
        audio: { uploadUrl: 'u2', objectPath: 'p2' },
      };
      memoryPointService.createUploadUrls.mockResolvedValue(expected);

      const result = await controller.createUploadUrls(
        VALID_UUID,
        { id: 'user-1' } as never,
        dto,
      );

      expect(memoryPointService.createUploadUrls).toHaveBeenCalledTimes(1);
      expect(memoryPointService.createUploadUrls).toHaveBeenCalledWith(
        VALID_UUID,
        'user-1',
        dto,
      );
      expect(result).toBe(expected);
    });
  });

  describe('getMyMemoryPoints', () => {
    it('delegates to getMyMemoryPoints with the user id and returns its page unchanged', async () => {
      const expected = { data: [{ id: VALID_UUID }], meta: { page: 1 } };
      memoryPointService.getMyMemoryPoints.mockResolvedValue(expected);

      const pageOptionsDto = { page: 1, take: 10 } as never;
      const result = await controller.getMyMemoryPoints(
        user as never,
        pageOptionsDto,
      );

      expect(memoryPointService.getMyMemoryPoints).toHaveBeenCalledTimes(1);
      expect(memoryPointService.getMyMemoryPoints).toHaveBeenCalledWith(
        user.id,
        pageOptionsDto,
      );
      expect(result).toBe(expected);
    });
  });

  describe('getOne', () => {
    it('delegates to getMemoryPoint with id, user id and role', async () => {
      const expected = { id: VALID_UUID };
      memoryPointService.getMemoryPoint.mockResolvedValue(expected);

      const result = await controller.getOne(VALID_UUID, user as never);

      expect(memoryPointService.getMemoryPoint).toHaveBeenCalledTimes(1);
      expect(memoryPointService.getMemoryPoint).toHaveBeenCalledWith(
        VALID_UUID,
        user.id,
        RoleType.CREATOR,
      );
      expect(result).toBe(expected);
    });
  });
});
