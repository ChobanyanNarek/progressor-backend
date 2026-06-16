import { HttpException } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  type ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { isAxiosError } from 'axios';
import type { Repository } from 'typeorm';

import { AiGenerationStatus } from '../../../../constants/ai-generation-status.ts';
import { GcsStorageService } from '../../../../shared/services/gcs-storage.service.ts';
import { ApplyGenerationResultCommand } from '../../../memory-points/commands/apply-generation-result/apply-generation-result.command.ts';
import { MarkGenerationStartedCommand } from '../../../memory-points/commands/mark-generation-started/mark-generation-started.command.ts';
import { MemoryPointNotReadyForGenerationException } from '../../../memory-points/exceptions/memory-point-not-ready-for-generation.exception.ts';
import { GetMemoryPointGenerationSourceQuery } from '../../../memory-points/queries/get-memory-point-generation-source/get-memory-point-generation-source.query.ts';
import {
  collectMissingGenerationFields,
  type IMemoryPointGenerationFields,
} from '../../../memory-points/utils/generation-readiness.ts';
import type { MemoryPointAiGenerationDto } from '../../dtos/memory-point-ai-generation.dto.ts';
import { AiGenerationFailedException } from '../../exceptions/ai-generation-failed.exception.ts';
import { AiGenerationInvalidMediaException } from '../../exceptions/ai-generation-invalid-media.exception.ts';
import { MemoryPointAiGenerationEntity } from '../../memory-point-ai-generation.entity.ts';
import { DidService } from '../../services/did.service.ts';
import { toDidCompatibleImage } from '../../utils/did-source-image.ts';
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

    /*
     * Read the generation-relevant fields, then enforce readiness here (the
     * command owns the rule). Any missing field aborts before the row is touched
     * or the provider is called, surfacing the `missingFields` contract.
     */
    const fields = await this.queryBus.execute<
      GetMemoryPointGenerationSourceQuery,
      IMemoryPointGenerationFields
    >(new GetMemoryPointGenerationSourceQuery(memoryPointId));

    const missingFields = collectMissingGenerationFields(fields);

    if (missingFields.length > 0) {
      throw new MemoryPointNotReadyForGenerationException(missingFields);
    }

    /*
     * Photo is non-null by the readiness guard; audio/description are the
     * script source — exactly one drives the talk (audio wins).
     */
    const sourcePhotoUrl = fields.sourcePhotoUrl!;
    const { sourceAudioUrl, description } = fields;

    let generation = await this.aiGenerationRepository
      .createQueryBuilder('aiGeneration')
      .where('aiGeneration.memoryPointId = :memoryPointId', { memoryPointId })
      .getOne();

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
      const photoBuffer = await this.gcsService.download(sourcePhotoUrl);

      /*
       * D-ID can't decode HEIC (the iPhone default the client uploads under a
       * `.jpg` path), which fails the talk at create time. Normalize to a
       * supported format and hand D-ID the bytes directly, so the source no
       * longer depends on whatever format the client happened to upload.
       *
       * Follow-up (asset-lifecycle): every (re)attempt uploads a fresh D-ID
       * /images asset and nothing deletes the previous one — we currently lean
       * on D-ID's own retention. Track provider-asset cleanup (delete prior
       * image on retry, or confirm/rely on TTL) in a follow-up ticket.
       */
      const {
        buffer: didImage,
        contentType,
        extension,
      } = await toDidCompatibleImage(photoBuffer);
      const sourceUrl = await this.didService.uploadImage(
        didImage,
        `${generation.id}.${extension}`,
        contentType,
      );

      /*
       * Audio wins: when a voice was uploaded, drive the talk with it; otherwise
       * D-ID synthesizes the voice from the description text. The readiness gate
       * guarantees at least one of the two is present.
       */
      const signedAudioUrl = sourceAudioUrl
        ? await this.gcsService.getSignedReadUrl(sourceAudioUrl)
        : undefined;

      const talk = await this.didService.createTalk({
        sourceUrl,
        audioUrl: signedAudioUrl,
        scriptText: signedAudioUrl ? undefined : (description ?? undefined),
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

      throw this.toGenerationException(error, errorMessage);
    }
  }

  /**
   * A 4xx from D-ID at create time means the media we sent was rejected
   * (unfetchable / undecodable / invalid source) — a client-recoverable problem,
   * so surface a 422 with a distinct code. Everything else (D-ID 5xx, network
   * errors, our own failures) is not client-recoverable and stays a 500.
   */
  private toGenerationException(error: unknown, detail: string): HttpException {
    const status = isAxiosError(error) ? error.response?.status : undefined;

    if (status !== undefined && status >= 400 && status < 500) {
      return new AiGenerationInvalidMediaException(detail);
    }

    return new AiGenerationFailedException(detail);
  }
}
