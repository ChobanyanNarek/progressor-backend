import { jest } from '@jest/globals';

import { PageDto } from '../../../common/dto/page.dto.ts';
import { MemoryPointStatus } from '../../../constants/memory-point-status.ts';
import { RoleType } from '../../../constants/role-type.ts';
import { AdminMemoryPointListItemDto } from '../dtos/admin-memory-point-list-item.dto.ts';
import { AdminMemoryPointController } from './admin-memory-point.controller.ts';

const VALID_UUID = '0190f8e2-0000-4000-8000-000000000000' as Uuid;

const validLocation = {
  type: 'Point' as const,
  coordinates: [44.5, 40.1] as [number, number],
};

const user = {
  id: 'admin-1' as Uuid,
  role: RoleType.ADMIN,
} as never;

describe('AdminMemoryPointController', () => {
  let memoryPointService: {
    getAllMemoryPoints: jest.Mock;
    getMemoryPoint: jest.Mock;
    updateStatus: jest.Mock;
    deleteMemoryPoint: jest.Mock;
    updateDetails: jest.Mock;
    generateVideo: jest.Mock;
    getVideoStatus: jest.Mock;
  };
  let controller: AdminMemoryPointController;

  beforeEach(() => {
    memoryPointService = {
      getAllMemoryPoints: jest.fn(),
      getMemoryPoint: jest.fn(),
      updateStatus: jest.fn(),
      deleteMemoryPoint: jest.fn(),
      updateDetails: jest.fn(),
      generateVideo: jest.fn(),
      getVideoStatus: jest.fn(),
    };
    controller = new AdminMemoryPointController(memoryPointService as never);
  });

  describe('getAll', () => {
    it('maps service items to AdminMemoryPointListItemDto and wraps in PageDto', async () => {
      const meta = { page: 1, take: 10 };
      memoryPointService.getAllMemoryPoints.mockResolvedValue({
        data: [
          {
            id: VALID_UUID,
            location: validLocation,
            status: MemoryPointStatus.ADMIN_REVIEWING,
            secret: 'should-not-leak',
          },
        ],
        meta,
      });

      const pageOptionsDto = { page: 1, take: 10 } as never;
      const result = await controller.getAll(pageOptionsDto);

      expect(memoryPointService.getAllMemoryPoints).toHaveBeenCalledWith(
        pageOptionsDto,
      );
      expect(result).toBeInstanceOf(PageDto);
      expect(result.meta).toBe(meta);
      expect(result.data[0]).toBeInstanceOf(AdminMemoryPointListItemDto);
      expect(result.data[0]).toEqual({
        id: VALID_UUID,
        location: validLocation,
        status: MemoryPointStatus.ADMIN_REVIEWING,
      });
    });

    it('returns an empty page when the service returns no items', async () => {
      const meta = { page: 1, take: 10 };
      memoryPointService.getAllMemoryPoints.mockResolvedValue({
        data: [],
        meta,
      });

      const result = await controller.getAll({} as never);

      expect(result.data).toEqual([]);
      expect(result.meta).toBe(meta);
    });
  });

  describe('getOne', () => {
    it('delegates to getMemoryPoint with id, user id and role', async () => {
      const expected = { id: VALID_UUID };
      memoryPointService.getMemoryPoint.mockResolvedValue(expected);

      const result = await controller.getOne(VALID_UUID, user);

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
      memoryPointService.updateStatus.mockResolvedValue(undefined);

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
      memoryPointService.deleteMemoryPoint.mockResolvedValue(undefined);

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
      memoryPointService.updateDetails.mockResolvedValue(undefined);

      await controller.updateDetails(VALID_UUID, dto);

      expect(memoryPointService.updateDetails).toHaveBeenCalledTimes(1);
      expect(memoryPointService.updateDetails).toHaveBeenCalledWith(
        VALID_UUID,
        dto,
      );
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

      const result = await controller.getVideoStatus(VALID_UUID, user);

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
