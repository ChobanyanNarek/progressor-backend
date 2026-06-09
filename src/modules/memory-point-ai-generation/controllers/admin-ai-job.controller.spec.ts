import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { AiGenerationStatus } from '../../../constants/ai-generation-status.ts';
import { AdminAiJobController } from './admin-ai-job.controller.ts';

describe('AdminAiJobController', () => {
  type ServiceMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;

  let aiGenerationService: { getAdminJobs: ServiceMock };
  let controller: AdminAiJobController;

  beforeEach(() => {
    aiGenerationService = {
      getAdminJobs: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    };
    controller = new AdminAiJobController(aiGenerationService as never);
  });

  it('delegates to getAdminJobs and returns its page unchanged', async () => {
    const expected = { data: [{ id: 'gen-1' }], meta: { page: 1 } };
    aiGenerationService.getAdminJobs.mockResolvedValue(expected);

    const pageOptionsDto = {
      page: 1,
      take: 20,
      order: 'DESC',
      status: AiGenerationStatus.PENDING,
    } as never;

    const result = await controller.getAll(pageOptionsDto);

    expect(aiGenerationService.getAdminJobs).toHaveBeenCalledTimes(1);
    expect(aiGenerationService.getAdminJobs).toHaveBeenCalledWith(
      pageOptionsDto,
    );
    expect(result).toBe(expected);
  });
});
