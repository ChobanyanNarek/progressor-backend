import { jest } from '@jest/globals';

import { RoleType } from '../../../constants/role-type.ts';
import { CreateAiGenerationCommand } from '../commands/create-ai-generation/create-ai-generation.command.ts';
import { ProcessDidWebhookCommand } from '../commands/process-did-webhook/process-did-webhook.command.ts';
import { MemoryPointAiGenerationService } from './memory-point-ai-generation.service.ts';
import { GetAiGenerationStatusQuery } from '../queries/get-ai-generation-status/get-ai-generation-status.query.ts';

describe('MemoryPointAiGenerationService', () => {
  let commandBus: { execute: jest.Mock };
  let queryBus: { execute: jest.Mock };
  let cloudTasksService: { enqueue: jest.Mock };
  let service: MemoryPointAiGenerationService;

  const pointId = 'point-1' as Uuid;
  const userId = 'user-1' as Uuid;
  const talkId = 'talk-123';

  beforeEach(() => {
    commandBus = { execute: jest.fn() };
    queryBus = { execute: jest.fn() };
    cloudTasksService = { enqueue: jest.fn() };

    service = new MemoryPointAiGenerationService(
      commandBus as never,
      queryBus as never,
      cloudTasksService as never,
    );
  });

  describe('generate', () => {
    it('dispatches CreateAiGenerationCommand and returns its result', async () => {
      const expected = { id: 'gen-1' };
      commandBus.execute.mockResolvedValue(expected);

      const result = await service.generate(pointId);

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      const command = commandBus.execute.mock.calls[0][0];
      expect(command).toBeInstanceOf(CreateAiGenerationCommand);
      expect(command.memoryPointId).toBe(pointId);
      expect(result).toBe(expected);
    });
  });

  describe('enqueueProcessing', () => {
    it('delegates to cloudTasksService.enqueue with { talkId }', async () => {
      cloudTasksService.enqueue.mockResolvedValue(undefined);

      await service.enqueueProcessing(talkId);

      expect(cloudTasksService.enqueue).toHaveBeenCalledTimes(1);
      expect(cloudTasksService.enqueue).toHaveBeenCalledWith({ talkId });
      expect(commandBus.execute).not.toHaveBeenCalled();
    });
  });

  describe('processWebhook', () => {
    it('dispatches ProcessDidWebhookCommand with the talkId', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      await service.processWebhook(talkId);

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      const command = commandBus.execute.mock.calls[0][0];
      expect(command).toBeInstanceOf(ProcessDidWebhookCommand);
      expect(command.talkId).toBe(talkId);
    });
  });

  describe('getStatus', () => {
    it('dispatches GetAiGenerationStatusQuery with all args and returns result', async () => {
      const expected = { status: 'GENERATING' };
      queryBus.execute.mockResolvedValue(expected);

      const result = await service.getStatus(pointId, userId, RoleType.ADMIN);

      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      const query = queryBus.execute.mock.calls[0][0];
      expect(query).toBeInstanceOf(GetAiGenerationStatusQuery);
      expect(query.memoryPointId).toBe(pointId);
      expect(query.userId).toBe(userId);
      expect(query.role).toBe(RoleType.ADMIN);
      expect(result).toBe(expected);
    });

    it('dispatches GetAiGenerationStatusQuery with only the id when no user/role', async () => {
      queryBus.execute.mockResolvedValue(undefined);

      await service.getStatus(pointId);

      const query = queryBus.execute.mock.calls[0][0];
      expect(query).toBeInstanceOf(GetAiGenerationStatusQuery);
      expect(query.memoryPointId).toBe(pointId);
      expect(query.userId).toBeUndefined();
      expect(query.role).toBeUndefined();
    });
  });
});
