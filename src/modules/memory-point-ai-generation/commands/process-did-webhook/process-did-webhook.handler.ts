import type { Readable } from 'node:stream';

import { HttpService } from '@nestjs/axios';
import { CommandBus, CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import type { Repository } from 'typeorm';

import { AiGenerationStatus } from '../../../../constants/ai-generation-status.ts';
import { GcsStorageService } from '../../../../shared/services/gcs-storage.service.ts';
import { ApplyGenerationResultCommand } from '../../../memory-points/commands/apply-generation-result/apply-generation-result.command.ts';
import { MemoryPointAiGenerationEntity } from '../../memory-point-ai-generation.entity.ts';
import { DidService } from '../../services/did.service.ts';
import { ProcessDidWebhookCommand } from './process-did-webhook.command.ts';

@CommandHandler(ProcessDidWebhookCommand)
export class ProcessDidWebhookHandler
  implements ICommandHandler<ProcessDidWebhookCommand, void>
{
  constructor(
    @InjectRepository(MemoryPointAiGenerationEntity)
    private readonly aiGenerationRepository: Repository<MemoryPointAiGenerationEntity>,
    private readonly didService: DidService,
    private readonly gcsService: GcsStorageService,
    private readonly commandBus: CommandBus,
    private readonly httpService: HttpService,
  ) {}

  async execute(command: ProcessDidWebhookCommand): Promise<void> {
    const { talkId } = command;

    const generation = await this.aiGenerationRepository.findOneBy({
      didTalkId: talkId,
    });

    if (!generation) {
      return;
    }

    if (generation.status === AiGenerationStatus.COMPLETED) {
      return;
    }

    const memoryPointId = generation.memoryPointId;

    const talk = await this.didService.getTalk(talkId);

    if (talk.status === 'done' && talk.resultUrl) {
      const videoStream = await this.openVideoStream(talk.resultUrl);
      const objectPath = `generations/${generation.memoryPointId}/${generation.id}/result.mp4`;

      await this.gcsService.uploadStream(objectPath, videoStream, 'video/mp4');

      generation.status = AiGenerationStatus.COMPLETED;

      generation.resultVideoUrl = talk.resultUrl;

      if (talk.durationSeconds !== undefined) {
        generation.durationSeconds = talk.durationSeconds;
      }

      await this.aiGenerationRepository.save(generation);

      await this.commandBus.execute(
        new ApplyGenerationResultCommand(memoryPointId, {
          status: AiGenerationStatus.COMPLETED,
          videoUrl: objectPath,
        }),
      );

      return;
    }

    if (talk.status === 'error' || talk.status === 'rejected') {
      const errorMessage = talk.error
        ? JSON.stringify(talk.error)
        : 'D-ID generation failed';

      generation.status = AiGenerationStatus.FAILED;
      generation.errorMessage = errorMessage;
      await this.aiGenerationRepository.save(generation);

      await this.commandBus.execute(
        new ApplyGenerationResultCommand(memoryPointId, {
          status: AiGenerationStatus.FAILED,
          errorMessage,
        }),
      );
    }
  }

  private async openVideoStream(url: string): Promise<Readable> {
    const response = await firstValueFrom(
      this.httpService.get<Readable>(url, {
        responseType: 'stream',
      }),
    );

    return response.data;
  }
}
