import { jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';

import { DidWebhookController } from './did-webhook.controller.ts';

const WEBHOOK_SECRET = 'shh';

describe('DidWebhookController', () => {
  let aiGenerationService: { enqueueProcessing: jest.Mock };
  let controller: DidWebhookController;

  beforeEach(() => {
    aiGenerationService = { enqueueProcessing: jest.fn() };
    const apiConfigService = {
      didConfig: { webhookSecret: WEBHOOK_SECRET },
    };
    controller = new DidWebhookController(
      aiGenerationService as never,
      apiConfigService as never,
    );
  });

  describe('handle', () => {
    it('throws UnauthorizedException when the secret is wrong', async () => {
      await expect(
        controller.handle('wrong-secret', { id: 'talk-1' } as never),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(aiGenerationService.enqueueProcessing).not.toHaveBeenCalled();
    });

    it('enqueues processing and acks when the secret matches and body has an id', async () => {
      aiGenerationService.enqueueProcessing.mockResolvedValue(undefined);

      const result = await controller.handle(WEBHOOK_SECRET, {
        id: 'talk-1',
      } as never);

      expect(aiGenerationService.enqueueProcessing).toHaveBeenCalledTimes(1);
      expect(aiGenerationService.enqueueProcessing).toHaveBeenCalledWith(
        'talk-1',
      );
      expect(result).toEqual({ received: true });
    });

    it('acks without enqueuing when the secret matches but body has no id', async () => {
      const result = await controller.handle(WEBHOOK_SECRET, {} as never);

      expect(aiGenerationService.enqueueProcessing).not.toHaveBeenCalled();
      expect(result).toEqual({ received: true });
    });
  });
});
