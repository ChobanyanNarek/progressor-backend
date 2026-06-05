import { jest } from '@jest/globals';

import { MemoryPointStatus } from '../../constants/memory-point-status.ts';
import { RoleType } from '../../constants/role-type.ts';
import { CreateMemoryPointCommand } from './commands/create-memory-point/create-memory-point.command.ts';
import { DeleteMemoryPointCommand } from './commands/delete-memory-point/delete-memory-point.command.ts';
import { UpdateMemoryPointDetailsCommand } from './commands/update-memory-point-details/update-memory-point-details.command.ts';
import { UpdateMemoryPointStatusCommand } from './commands/update-memory-point-status/update-memory-point-status.command.ts';
import { UpsertMemoryPointDetailsCommand } from './commands/upsert-memory-point-details/upsert-memory-point-details.command.ts';
import { MemoryPointService } from './memory-point.service.ts';
import { GetAllMemoryPointsQuery } from './queries/get-all-memory-points/get-all-memory-points.query.ts';
import { GetMemoryPointQuery } from './queries/get-memory-point/get-memory-point.query.ts';
import { GetMyMemoryPointsQuery } from './queries/get-my-memory-points/get-my-memory-points.query.ts';
import { GetNearbyMemoryPointsQuery } from './queries/get-nearby-memory-points/get-nearby-memory-points.query.ts';

describe('MemoryPointService', () => {
  let commandBus: { execute: jest.Mock };
  let queryBus: { execute: jest.Mock };
  let aiGenerationService: { generate: jest.Mock; getStatus: jest.Mock };
  let service: MemoryPointService;

  const pointId = 'point-1' as Uuid;
  const userId = 'user-1' as Uuid;

  beforeEach(() => {
    commandBus = { execute: jest.fn() };
    queryBus = { execute: jest.fn() };
    aiGenerationService = { generate: jest.fn(), getStatus: jest.fn() };

    service = new MemoryPointService(
      commandBus as never,
      queryBus as never,
      aiGenerationService as never,
    );
  });

  describe('createMemoryPoint', () => {
    it('dispatches CreateMemoryPointCommand and returns its result', async () => {
      const dto = { foo: 'bar' } as never;
      const expected = { id: pointId };
      commandBus.execute.mockResolvedValue(expected);

      const result = await service.createMemoryPoint(userId, dto);

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      const command = commandBus.execute.mock.calls[0][0];
      expect(command).toBeInstanceOf(CreateMemoryPointCommand);
      expect(command.userId).toBe(userId);
      expect(command.createMemoryPointDto).toBe(dto);
      expect(result).toBe(expected);
    });
  });

  describe('getMemoryPoint', () => {
    it('dispatches GetMemoryPointQuery with all args and returns result', async () => {
      const expected = { id: pointId };
      queryBus.execute.mockResolvedValue(expected);

      const result = await service.getMemoryPoint(
        pointId,
        userId,
        RoleType.ADMIN,
      );

      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      const query = queryBus.execute.mock.calls[0][0];
      expect(query).toBeInstanceOf(GetMemoryPointQuery);
      expect(query.memoryPointId).toBe(pointId);
      expect(query.userId).toBe(userId);
      expect(query.role).toBe(RoleType.ADMIN);
      expect(result).toBe(expected);
    });

    it('dispatches GetMemoryPointQuery with only the id when no user/role', async () => {
      queryBus.execute.mockResolvedValue(undefined);

      await service.getMemoryPoint(pointId);

      const query = queryBus.execute.mock.calls[0][0];
      expect(query).toBeInstanceOf(GetMemoryPointQuery);
      expect(query.memoryPointId).toBe(pointId);
      expect(query.userId).toBeUndefined();
      expect(query.role).toBeUndefined();
    });
  });

  describe('getMyMemoryPoints', () => {
    it('dispatches GetMyMemoryPointsQuery and returns result', async () => {
      const pageOptionsDto = { page: 1, take: 10 } as never;
      const expected = { data: [], meta: {} };
      queryBus.execute.mockResolvedValue(expected);

      const result = await service.getMyMemoryPoints(userId, pageOptionsDto);

      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      const query = queryBus.execute.mock.calls[0][0];
      expect(query).toBeInstanceOf(GetMyMemoryPointsQuery);
      expect(query.userId).toBe(userId);
      expect(query.pageOptionsDto).toBe(pageOptionsDto);
      expect(result).toBe(expected);
    });
  });

  describe('getAllMemoryPoints', () => {
    it('dispatches GetAllMemoryPointsQuery and returns result', async () => {
      const pageOptionsDto = { page: 1, take: 10 } as never;
      const expected = { data: [], meta: {} };
      queryBus.execute.mockResolvedValue(expected);

      const result = await service.getAllMemoryPoints(pageOptionsDto);

      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      const query = queryBus.execute.mock.calls[0][0];
      expect(query).toBeInstanceOf(GetAllMemoryPointsQuery);
      expect(query.pageOptionsDto).toBe(pageOptionsDto);
      expect(result).toBe(expected);
    });
  });

  describe('getNearbyMemoryPoints', () => {
    it('dispatches GetNearbyMemoryPointsQuery and returns result', async () => {
      const pageOptionsDto = { latitude: 40, longitude: 44 } as never;
      const expected = { data: [], meta: {} };
      queryBus.execute.mockResolvedValue(expected);

      const result = await service.getNearbyMemoryPoints(pageOptionsDto);

      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      const query = queryBus.execute.mock.calls[0][0];
      expect(query).toBeInstanceOf(GetNearbyMemoryPointsQuery);
      expect(query.pageOptionsDto).toBe(pageOptionsDto);
      expect(result).toBe(expected);
    });
  });

  describe('updateStatus', () => {
    it('dispatches UpdateMemoryPointStatusCommand', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      await service.updateStatus(pointId, MemoryPointStatus.APPROVED);

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      const command = commandBus.execute.mock.calls[0][0];
      expect(command).toBeInstanceOf(UpdateMemoryPointStatusCommand);
      expect(command.memoryPointId).toBe(pointId);
      expect(command.status).toBe(MemoryPointStatus.APPROVED);
    });
  });

  describe('updateDetails', () => {
    it('dispatches UpdateMemoryPointDetailsCommand', async () => {
      const dto = { title: 'x' } as never;
      commandBus.execute.mockResolvedValue(undefined);

      await service.updateDetails(pointId, dto);

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      const command = commandBus.execute.mock.calls[0][0];
      expect(command).toBeInstanceOf(UpdateMemoryPointDetailsCommand);
      expect(command.memoryPointId).toBe(pointId);
      expect(command.dto).toBe(dto);
    });
  });

  describe('deleteMemoryPoint', () => {
    it('dispatches DeleteMemoryPointCommand', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      await service.deleteMemoryPoint(pointId);

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      const command = commandBus.execute.mock.calls[0][0];
      expect(command).toBeInstanceOf(DeleteMemoryPointCommand);
      expect(command.memoryPointId).toBe(pointId);
    });
  });

  describe('upsertDetails', () => {
    it('dispatches UpsertMemoryPointDetailsCommand and returns result', async () => {
      const dto = { title: 'x' } as never;
      const expected = { id: 'details-1' };
      commandBus.execute.mockResolvedValue(expected);

      const result = await service.upsertDetails(pointId, userId, dto);

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      const command = commandBus.execute.mock.calls[0][0];
      expect(command).toBeInstanceOf(UpsertMemoryPointDetailsCommand);
      expect(command.memoryPointId).toBe(pointId);
      expect(command.userId).toBe(userId);
      expect(command.upsertMemoryPointDetailsDto).toBe(dto);
      expect(result).toBe(expected);
    });
  });

  describe('generateVideo', () => {
    it('delegates to aiGenerationService.generate and returns its result', async () => {
      const expected = { id: 'gen-1' };
      aiGenerationService.generate.mockResolvedValue(expected);

      const result = await service.generateVideo(pointId);

      expect(aiGenerationService.generate).toHaveBeenCalledTimes(1);
      expect(aiGenerationService.generate).toHaveBeenCalledWith(pointId);
      expect(commandBus.execute).not.toHaveBeenCalled();
      expect(result).toBe(expected);
    });
  });

  describe('getVideoStatus', () => {
    it('delegates to aiGenerationService.getStatus and returns its result', async () => {
      const expected = { status: 'GENERATING' };
      aiGenerationService.getStatus.mockResolvedValue(expected);

      const result = await service.getVideoStatus(
        pointId,
        userId,
        RoleType.ADMIN,
      );

      expect(aiGenerationService.getStatus).toHaveBeenCalledTimes(1);
      expect(aiGenerationService.getStatus).toHaveBeenCalledWith(
        pointId,
        userId,
        RoleType.ADMIN,
      );
      expect(queryBus.execute).not.toHaveBeenCalled();
      expect(result).toBe(expected);
    });
  });
});
