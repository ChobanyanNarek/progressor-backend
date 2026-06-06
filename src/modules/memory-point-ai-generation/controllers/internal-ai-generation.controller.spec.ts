import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { InternalAiGenerationController } from './internal-ai-generation.controller.ts';

describe('InternalAiGenerationController', () => {
  let aiGenerationService: {
    processWebhook: jest.Mock<(talkId: unknown) => Promise<unknown>>;
  };
  let controller: InternalAiGenerationController;

  beforeEach(() => {
    aiGenerationService = {
      processWebhook: jest.fn<(talkId: unknown) => Promise<unknown>>(),
    };
    controller = new InternalAiGenerationController(
      aiGenerationService as never,
    );
  });

  describe('process', () => {
    it('delegates to processWebhook with body.talkId and returns processed:true', async () => {
      const result = await controller.process({ talkId: 'talk-1' } as never);

      expect(aiGenerationService.processWebhook).toHaveBeenCalledTimes(1);
      expect(aiGenerationService.processWebhook).toHaveBeenCalledWith('talk-1');
      expect(result).toEqual({ processed: true });
    });
  });
});
