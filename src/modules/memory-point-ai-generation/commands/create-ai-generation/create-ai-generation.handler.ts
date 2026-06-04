import {
  CommandBus,
  CommandHandler,
  type ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { AiGenerationStatus } from '../../../../constants/ai-generation-status.ts';
import { GcsStorageService } from '../../../../shared/services/gcs-storage.service.ts';
import { ApplyGenerationResultCommand } from '../../../memory-points/commands/apply-generation-result/apply-generation-result.command.ts';
import { MarkGenerationStartedCommand } from '../../../memory-points/commands/mark-generation-started/mark-generation-started.command.ts';
import {
  GetMemoryPointGenerationSourceQuery,
  type MemoryPointGenerationSource,
} from '../../../memory-points/queries/get-memory-point-generation-source/get-memory-point-generation-source.query.ts';
import type { MemoryPointAiGenerationDto } from '../../dtos/memory-point-ai-generation.dto.ts';
import { MemoryPointAiGenerationEntity } from '../../memory-point-ai-generation.entity.ts';
import { DidService } from '../../services/did.service.ts';
import { CreateAiGenerationCommand } from './create-ai-generation.command.ts';

@CommandHandler(CreateAiGenerationCommand)
export class CreateAiGenerationHandler
  implements
    ICommandHandler<CreateAiGenerationCommand, MemoryPointAiGenerationDto>
{
  constructor(
    @InjectRepository(MemoryPointAiGenerationEntity)
    private readonly aiGenerationRepository: Repository<MemoryPointAiGenerationEntity>,
    private readonly didService: DidService,
    private readonly gcsService: GcsStorageService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(
    command: CreateAiGenerationCommand,
  ): Promise<MemoryPointAiGenerationDto> {
    const { memoryPointId } = command;

    const { sourcePhotoUrl, sourceAudioUrl } = await this.queryBus.execute<
      GetMemoryPointGenerationSourceQuery,
      MemoryPointGenerationSource
    >(new GetMemoryPointGenerationSourceQuery(memoryPointId));

    let generation = await this.aiGenerationRepository.findOneBy({
      memoryPointId,
    });

    if (!generation) {
      generation = this.aiGenerationRepository.create({
        memoryPointId,
        status: AiGenerationStatus.PENDING,
        attemptNumber: 1,
      });
    } else if (generation.status !== AiGenerationStatus.PENDING) {
      generation.attemptNumber += 1;
      generation.status = AiGenerationStatus.PENDING;
      generation.didTalkId = undefined;
      generation.resultVideoUrl = undefined;
      generation.errorMessage = undefined;
    }

    await this.aiGenerationRepository.save(generation);

    try {
      const [signedPhotoUrl, signedAudioUrl] = await Promise.all([
        this.gcsService.getSignedReadUrl(sourcePhotoUrl),
        this.gcsService.getSignedReadUrl(sourceAudioUrl),
      ]);

      const talk = await this.didService.createTalk({
        sourceUrl: signedPhotoUrl,
        audioUrl: signedAudioUrl,
        userData: generation.id,
      });

      generation.didTalkId = talk.id;
      generation.userData = generation.id;
      generation.status = AiGenerationStatus.PROCESSING;
      await this.aiGenerationRepository.save(generation);

      await this.commandBus.execute(
        new MarkGenerationStartedCommand(memoryPointId),
      );

      return generation.toDto();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      generation.status = AiGenerationStatus.FAILED;
      generation.errorMessage = errorMessage;
      await this.aiGenerationRepository.save(generation);

      await this.commandBus.execute(
        new ApplyGenerationResultCommand(memoryPointId, {
          status: AiGenerationStatus.FAILED,
          errorMessage,
        }),
      );

      throw error;
    }
  }
}
