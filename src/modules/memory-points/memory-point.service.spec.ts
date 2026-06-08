import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { AudioFileType } from '../../constants/audio-file-type.ts';
import { MemoryPointStatus } from '../../constants/memory-point-status.ts';
import { PhotoFileType } from '../../constants/photo-file-type.ts';
import { RoleType } from '../../constants/role-type.ts';
import { CreateMemoryPointCommand } from './commands/create-memory-point/create-memory-point.command.ts';
import { CreateUploadUrlCommand } from './commands/create-upload-url/create-upload-url.command.ts';
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
  let commandBus: {
    execute: jest.Mock<(command: unknown) => Promise<unknown>>;
  };
  let queryBus: { execute: jest.Mock<(query: unknown) => Promise<unknown>> };
  let aiGenerationService: {
    generate: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
    getStatus: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  };
  let service: MemoryPointService;

  const pointId = 'point-1' as Uuid;
  const userId = 'user-1' as Uuid;

  beforeEach(() => {
    commandBus = {
      execute: jest.fn<(command: unknown) => Promise<unknown>>(),
    };
    queryBus = { execute: jest.fn<(query: unknown) => Promise<unknown>>() };
    aiGenerationService = {
      generate: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      getStatus: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    };

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
      const command = commandBus.execute.mock
        .calls[0]![0] as CreateMemoryPointCommand;
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
      const query = queryBus.execute.mock.calls[0]![0] as GetMemoryPointQuery;
      expect(query).toBeInstanceOf(GetMemoryPointQuery);
      expect(query.memoryPointId).toBe(pointId);
      expect(query.userId).toBe(userId);
      expect(query.role).toBe(RoleType.ADMIN);
      expect(result).toBe(expected);
    });

    it('dispatches GetMemoryPointQuery with only the id when no user/role', async () => {
      await service.getMemoryPoint(pointId);

      const query = queryBus.execute.mock.calls[0]![0] as GetMemoryPointQuery;
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
      const query = queryBus.execute.mock
        .calls[0]![0] as GetMyMemoryPointsQuery;
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
      const query = queryBus.execute.mock
        .calls[0]![0] as GetAllMemoryPointsQuery;
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
      const query = queryBus.execute.mock
        .calls[0]![0] as GetNearbyMemoryPointsQuery;
      expect(query).toBeInstanceOf(GetNearbyMemoryPointsQuery);
      expect(query.pageOptionsDto).toBe(pageOptionsDto);
      expect(result).toBe(expected);
    });
  });

  describe('updateStatus', () => {
    it('dispatches UpdateMemoryPointStatusCommand', async () => {
      await service.updateStatus(pointId, MemoryPointStatus.APPROVED);

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      const command = commandBus.execute.mock
        .calls[0]![0] as UpdateMemoryPointStatusCommand;
      expect(command).toBeInstanceOf(UpdateMemoryPointStatusCommand);
      expect(command.memoryPointId).toBe(pointId);
      expect(command.status).toBe(MemoryPointStatus.APPROVED);
    });
  });

  describe('updateDetails', () => {
    it('dispatches UpdateMemoryPointDetailsCommand', async () => {
      const dto = { title: 'x' } as never;

      await service.updateDetails(pointId, dto);

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      const command = commandBus.execute.mock
        .calls[0]![0] as UpdateMemoryPointDetailsCommand;
      expect(command).toBeInstanceOf(UpdateMemoryPointDetailsCommand);
      expect(command.memoryPointId).toBe(pointId);
      expect(command.dto).toBe(dto);
    });
  });

  describe('deleteMemoryPoint', () => {
    it('dispatches DeleteMemoryPointCommand', async () => {
      await service.deleteMemoryPoint(pointId);

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      const command = commandBus.execute.mock
        .calls[0]![0] as DeleteMemoryPointCommand;
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
      const command = commandBus.execute.mock
        .calls[0]![0] as UpsertMemoryPointDetailsCommand;
      expect(command).toBeInstanceOf(UpsertMemoryPointDetailsCommand);
      expect(command.memoryPointId).toBe(pointId);
      expect(command.userId).toBe(userId);
      expect(command.upsertMemoryPointDetailsDto).toBe(dto);
      expect(result).toBe(expected);
    });
  });

  describe('createUploadUrls', () => {
    it('dispatches CreateUploadUrlCommand and returns result', async () => {
      const dto = {
        photoContentType: PhotoFileType.JPG,
        audioContentType: AudioFileType.MP3,
      } as never;
      const expected = {
        photo: { uploadUrl: 'u1', objectPath: 'p1' },
        audio: { uploadUrl: 'u2', objectPath: 'p2' },
      };
      commandBus.execute.mockResolvedValue(expected);

      const result = await service.createUploadUrls(pointId, userId, dto);

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      const command = commandBus.execute.mock
        .calls[0]![0] as CreateUploadUrlCommand;
      expect(command).toBeInstanceOf(CreateUploadUrlCommand);
      expect(command.memoryPointId).toBe(pointId);
      expect(command.userId).toBe(userId);
      expect(command.requestUploadUrlDto).toBe(dto);
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
