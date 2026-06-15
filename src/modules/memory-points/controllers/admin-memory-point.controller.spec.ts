import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { MemoryPointStatus } from '../../../constants/memory-point-status.ts';
import { RoleType } from '../../../constants/role-type.ts';
import { AdminMemoryPointController } from './admin-memory-point.controller.ts';

const VALID_UUID = '0190f8e2-0000-4000-8000-000000000000' as Uuid;

const user: { id: Uuid; role: RoleType } = {
  id: 'admin-1' as Uuid,
  role: RoleType.ADMIN,
};

describe('AdminMemoryPointController', () => {
  type ServiceMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;

  let memoryPointService: {
    getAllMemoryPoints: ServiceMock;
    getMemoryPoint: ServiceMock;
    updateStatus: ServiceMock;
    deleteMemoryPoint: ServiceMock;
    updateDetails: ServiceMock;
    createAdminUploadUrls: ServiceMock;
    generateVideo: ServiceMock;
    getVideoStatus: ServiceMock;
  };
  let controller: AdminMemoryPointController;

  beforeEach(() => {
    memoryPointService = {
      getAllMemoryPoints: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      getMemoryPoint: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      updateStatus: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      deleteMemoryPoint: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      updateDetails: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      createAdminUploadUrls:
        jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      generateVideo: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      getVideoStatus: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    };
    controller = new AdminMemoryPointController(memoryPointService as never);
  });

  describe('getAll', () => {
    it('delegates to getAllMemoryPoints and returns its page unchanged', async () => {
      const expected = { data: [{ id: VALID_UUID }], meta: { page: 1 } };
      memoryPointService.getAllMemoryPoints.mockResolvedValue(expected);

      const pageOptionsDto = { page: 1, take: 10 } as never;
      const result = await controller.getAll(pageOptionsDto);

      expect(memoryPointService.getAllMemoryPoints).toHaveBeenCalledTimes(1);
      expect(memoryPointService.getAllMemoryPoints).toHaveBeenCalledWith(
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

      expect(memoryPointService.getMemoryPoint).toHaveBeenCalledWith(
        VALID_UUID,
        user.id,
        RoleType.ADMIN,
      );
      expect(result).toBe(expected);
    });
  });

  describe('updateStatus', () => {
    it('delegates to updateStatus with id and dto.status', async () => {
      await controller.updateStatus(VALID_UUID, {
        status: MemoryPointStatus.APPROVED,
      } as never);

      expect(memoryPointService.updateStatus).toHaveBeenCalledTimes(1);
      expect(memoryPointService.updateStatus).toHaveBeenCalledWith(
        VALID_UUID,
        MemoryPointStatus.APPROVED,
      );
    });
  });

  describe('delete', () => {
    it('delegates to deleteMemoryPoint with the id', async () => {
      await controller.delete(VALID_UUID);

      expect(memoryPointService.deleteMemoryPoint).toHaveBeenCalledTimes(1);
      expect(memoryPointService.deleteMemoryPoint).toHaveBeenCalledWith(
        VALID_UUID,
      );
    });
  });

  describe('updateDetails', () => {
    it('delegates to updateDetails with id and dto', async () => {
      const dto = { title: 'x' } as never;

      await controller.updateDetails(VALID_UUID, dto);

      expect(memoryPointService.updateDetails).toHaveBeenCalledTimes(1);
      expect(memoryPointService.updateDetails).toHaveBeenCalledWith(
        VALID_UUID,
        dto,
      );
    });
  });

  describe('createMediaUploadUrls', () => {
    it('delegates to createAdminUploadUrls with id and dto and returns its result', async () => {
      const expected = { photo: {}, audio: {} };
      memoryPointService.createAdminUploadUrls.mockResolvedValue(expected);
      const dto = {
        photoContentType: 'jpg',
        audioContentType: 'mp3',
      } as never;

      const result = await controller.createMediaUploadUrls(VALID_UUID, dto);

      expect(memoryPointService.createAdminUploadUrls).toHaveBeenCalledTimes(1);
      expect(memoryPointService.createAdminUploadUrls).toHaveBeenCalledWith(
        VALID_UUID,
        dto,
      );
      expect(result).toBe(expected);
    });
  });

  describe('generateVideo', () => {
    it('delegates to generateVideo with the id and returns its result', async () => {
      const expected = { id: 'gen-1' };
      memoryPointService.generateVideo.mockResolvedValue(expected);

      const result = await controller.generateVideo(VALID_UUID);

      expect(memoryPointService.generateVideo).toHaveBeenCalledTimes(1);
      expect(memoryPointService.generateVideo).toHaveBeenCalledWith(VALID_UUID);
      expect(result).toBe(expected);
    });
  });

  describe('getVideoStatus', () => {
    it('delegates to getVideoStatus with id, user id and role', async () => {
      const expected = { status: 'GENERATING' };
      memoryPointService.getVideoStatus.mockResolvedValue(expected);

      const result = await controller.getVideoStatus(VALID_UUID, user as never);

      expect(memoryPointService.getVideoStatus).toHaveBeenCalledTimes(1);
      expect(memoryPointService.getVideoStatus).toHaveBeenCalledWith(
        VALID_UUID,
        user.id,
        RoleType.ADMIN,
      );
      expect(result).toBe(expected);
    });
  });
});
