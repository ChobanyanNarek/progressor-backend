import { jest } from '@jest/globals';

import { PageDto } from '../../../common/dto/page.dto.ts';
import { MemoryPointStatus } from '../../../constants/memory-point-status.ts';
import { RoleType } from '../../../constants/role-type.ts';
import { MyMemoryPointDto } from '../dtos/my-memory-point.dto.ts';
import { CreatorMemoryPointController } from './creator-memory-point.controller.ts';

const VALID_UUID = '0190f8e2-0000-4000-8000-000000000000' as Uuid;

const validLocation = {
  type: 'Point' as const,
  coordinates: [44.5, 40.1] as [number, number],
};

const user = {
  id: 'user-1' as Uuid,
  role: RoleType.CREATOR,
} as never;

describe('CreatorMemoryPointController', () => {
  let memoryPointService: {
    createMemoryPoint: jest.Mock;
    upsertDetails: jest.Mock;
    getMyMemoryPoints: jest.Mock;
    getMemoryPoint: jest.Mock;
  };
  let controller: CreatorMemoryPointController;

  beforeEach(() => {
    memoryPointService = {
      createMemoryPoint: jest.fn(),
      upsertDetails: jest.fn(),
      getMyMemoryPoints: jest.fn(),
      getMemoryPoint: jest.fn(),
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

  describe('getMyMemoryPoints', () => {
    it('maps service items to MyMemoryPointDto and wraps in PageDto', async () => {
      const meta = { page: 1, take: 10 };
      memoryPointService.getMyMemoryPoints.mockResolvedValue({
        data: [
          {
            id: VALID_UUID,
            location: validLocation,
            status: MemoryPointStatus.PENDING,
            secret: 'should-not-leak',
          },
        ],
        meta,
      });

      const pageOptionsDto = { page: 1, take: 10 } as never;
      const result = await controller.getMyMemoryPoints(user, pageOptionsDto);

      expect(memoryPointService.getMyMemoryPoints).toHaveBeenCalledWith(
        user.id,
        pageOptionsDto,
      );
      expect(result).toBeInstanceOf(PageDto);
      expect(result.meta).toBe(meta);
      expect(result.data[0]).toBeInstanceOf(MyMemoryPointDto);
      expect(result.data[0]).toEqual({
        id: VALID_UUID,
        location: validLocation,
        status: MemoryPointStatus.PENDING,
      });
    });

    it('returns an empty page when the service returns no items', async () => {
      const meta = { page: 1, take: 10 };
      memoryPointService.getMyMemoryPoints.mockResolvedValue({
        data: [],
        meta,
      });

      const result = await controller.getMyMemoryPoints(user, {} as never);

      expect(result.data).toEqual([]);
      expect(result.meta).toBe(meta);
    });
  });

  describe('getOne', () => {
    it('delegates to getMemoryPoint with id, user id and role', async () => {
      const expected = { id: VALID_UUID };
      memoryPointService.getMemoryPoint.mockResolvedValue(expected);

      const result = await controller.getOne(VALID_UUID, user);

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
