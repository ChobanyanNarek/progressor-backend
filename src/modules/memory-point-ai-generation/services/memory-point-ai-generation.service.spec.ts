import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { RoleType } from '../../../constants/role-type.ts';
import { CreateAiGenerationCommand } from '../commands/create-ai-generation/create-ai-generation.command.ts';
import { ProcessDidWebhookCommand } from '../commands/process-did-webhook/process-did-webhook.command.ts';
import { GetAiGenerationStatusQuery } from '../queries/get-ai-generation-status/get-ai-generation-status.query.ts';
import { MemoryPointAiGenerationService } from './memory-point-ai-generation.service.ts';

describe('MemoryPointAiGenerationService', () => {
  let commandBus: {
    execute: jest.Mock<(command: unknown) => Promise<unknown>>;
  };
  let queryBus: { execute: jest.Mock<(query: unknown) => Promise<unknown>> };
  let cloudTasksService: {
    enqueue: jest.Mock<(payload: unknown) => Promise<unknown>>;
  };
  let service: MemoryPointAiGenerationService;

  const pointId = 'point-1' as Uuid;
  const userId = 'user-1' as Uuid;
  const talkId = 'talk-123';

  beforeEach(() => {
    commandBus = {
      execute: jest.fn<(command: unknown) => Promise<unknown>>(),
    };
    queryBus = { execute: jest.fn<(query: unknown) => Promise<unknown>>() };
    cloudTasksService = {
      enqueue: jest.fn<(payload: unknown) => Promise<unknown>>(),
    };

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
      const command = commandBus.execute.mock
        .calls[0]![0] as CreateAiGenerationCommand;
      expect(command).toBeInstanceOf(CreateAiGenerationCommand);
      expect(command.memoryPointId).toBe(pointId);
      expect(result).toBe(expected);
    });
  });

  describe('enqueueProcessing', () => {
    it('delegates to cloudTasksService.enqueue with { talkId }', async () => {
      await service.enqueueProcessing(talkId);

      expect(cloudTasksService.enqueue).toHaveBeenCalledTimes(1);
      expect(cloudTasksService.enqueue).toHaveBeenCalledWith({ talkId });
      expect(commandBus.execute).not.toHaveBeenCalled();
    });
  });

  describe('processWebhook', () => {
    it('dispatches ProcessDidWebhookCommand with the talkId', async () => {
      await service.processWebhook(talkId);

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      const command = commandBus.execute.mock
        .calls[0]![0] as ProcessDidWebhookCommand;
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
      const query = queryBus.execute.mock
        .calls[0]![0] as GetAiGenerationStatusQuery;
      expect(query).toBeInstanceOf(GetAiGenerationStatusQuery);
      expect(query.memoryPointId).toBe(pointId);
      expect(query.userId).toBe(userId);
      expect(query.role).toBe(RoleType.ADMIN);
      expect(result).toBe(expected);
    });

    it('dispatches GetAiGenerationStatusQuery with only the id when no user/role', async () => {
      await service.getStatus(pointId);

      const query = queryBus.execute.mock
        .calls[0]![0] as GetAiGenerationStatusQuery;
      expect(query).toBeInstanceOf(GetAiGenerationStatusQuery);
      expect(query.memoryPointId).toBe(pointId);
      expect(query.userId).toBeUndefined();
      expect(query.role).toBeUndefined();
    });
  });
});
