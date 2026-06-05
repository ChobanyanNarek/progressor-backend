import { jest } from '@jest/globals';

import { PageDto } from '../../../common/dto/page.dto.ts';
import { MemoryPointStatus } from '../../../constants/memory-point-status.ts';
import { NearbyMemoryPointDto } from '../dtos/nearby-memory-point.dto.ts';
import { MemoryPointController } from './memory-point.controller.ts';

const VALID_UUID = '0190f8e2-0000-4000-8000-000000000000' as Uuid;

const validLocation = {
  type: 'Point' as const,
  coordinates: [44.5, 40.1] as [number, number],
};

describe('MemoryPointController', () => {
  let memoryPointService: {
    getNearbyMemoryPoints: jest.Mock;
    getMemoryPoint: jest.Mock;
  };
  let controller: MemoryPointController;

  beforeEach(() => {
    memoryPointService = {
      getNearbyMemoryPoints: jest.fn(),
      getMemoryPoint: jest.fn(),
    };
    controller = new MemoryPointController(memoryPointService as never);
  });

  describe('getNearby', () => {
    it('maps service items to NearbyMemoryPointDto and wraps in PageDto', async () => {
      const meta = { page: 1, take: 10 };
      memoryPointService.getNearbyMemoryPoints.mockResolvedValue({
        data: [
          {
            id: VALID_UUID,
            location: validLocation,
            status: MemoryPointStatus.APPROVED,
            secret: 'should-not-leak',
          },
        ],
        meta,
      });

      const pageOptionsDto = { latitude: 40, longitude: 44 } as never;
      const result = await controller.getNearby(pageOptionsDto);

      expect(memoryPointService.getNearbyMemoryPoints).toHaveBeenCalledWith(
        pageOptionsDto,
      );
      expect(result).toBeInstanceOf(PageDto);
      expect(result.meta).toBe(meta);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toBeInstanceOf(NearbyMemoryPointDto);
      expect(result.data[0]).toEqual({
        id: VALID_UUID,
        location: validLocation,
      });
    });

    it('returns an empty page when the service returns no items', async () => {
      const meta = { page: 1, take: 10 };
      memoryPointService.getNearbyMemoryPoints.mockResolvedValue({
        data: [],
        meta,
      });

      const result = await controller.getNearby({} as never);

      expect(result).toBeInstanceOf(PageDto);
      expect(result.data).toEqual([]);
      expect(result.meta).toBe(meta);
    });
  });

  describe('getOnePublic', () => {
    it('delegates to memoryPointService.getMemoryPoint with the id', async () => {
      const expected = { id: VALID_UUID };
      memoryPointService.getMemoryPoint.mockResolvedValue(expected);

      const result = await controller.getOnePublic(VALID_UUID);

      expect(memoryPointService.getMemoryPoint).toHaveBeenCalledTimes(1);
      expect(memoryPointService.getMemoryPoint).toHaveBeenCalledWith(
        VALID_UUID,
      );
      expect(result).toBe(expected);
    });
  });
});
