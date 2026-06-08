import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { MemoryPointController } from './memory-point.controller.ts';

const VALID_UUID = '0190f8e2-0000-4000-8000-000000000000' as Uuid;

describe('MemoryPointController', () => {
  type ServiceMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;

  let memoryPointService: {
    getNearbyMemoryPoints: ServiceMock;
    getMemoryPoint: ServiceMock;
  };
  let controller: MemoryPointController;

  beforeEach(() => {
    memoryPointService = {
      getNearbyMemoryPoints:
        jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      getMemoryPoint: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    };
    controller = new MemoryPointController(memoryPointService as never);
  });

  describe('getNearby', () => {
    it('delegates to getNearbyMemoryPoints and returns its page unchanged', async () => {
      const expected = { data: [{ id: VALID_UUID }], meta: { page: 1 } };
      memoryPointService.getNearbyMemoryPoints.mockResolvedValue(expected);

      const pageOptionsDto = { latitude: 40, longitude: 44 } as never;
      const result = await controller.getNearby(pageOptionsDto);

      expect(memoryPointService.getNearbyMemoryPoints).toHaveBeenCalledTimes(1);
      expect(memoryPointService.getNearbyMemoryPoints).toHaveBeenCalledWith(
        pageOptionsDto,
      );
      expect(result).toBe(expected);
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
