import { type IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { GetMemoryPointQuery } from '../../../memory-points/queries/get-memory-point/get-memory-point.query.ts';
import { AiGenerationStatusResponseDto } from '../../dtos/ai-generation-status.dto.ts';
import { MemoryPointAiGenerationEntity } from '../../memory-point-ai-generation.entity.ts';
import { GetAiGenerationStatusQuery } from './get-ai-generation-status.query.ts';

@QueryHandler(GetAiGenerationStatusQuery)
export class GetAiGenerationStatusHandler
  implements
    IQueryHandler<GetAiGenerationStatusQuery, AiGenerationStatusResponseDto>
{
  constructor(
    private readonly queryBus: QueryBus,
    @InjectRepository(MemoryPointAiGenerationEntity)
    private readonly aiGenerationRepository: Repository<MemoryPointAiGenerationEntity>,
  ) {}

  async execute(
    query: GetAiGenerationStatusQuery,
  ): Promise<AiGenerationStatusResponseDto> {
    await this.queryBus.execute(
      new GetMemoryPointQuery(query.memoryPointId, query.userId, query.role),
    );

    const generation = await this.aiGenerationRepository.findOneBy({
      memoryPointId: query.memoryPointId,
    });

    return AiGenerationStatusResponseDto.create({
      status: generation?.status,
    });
  }
}
