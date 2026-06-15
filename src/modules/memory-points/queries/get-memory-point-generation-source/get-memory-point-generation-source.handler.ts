import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { MemoryPointDetailsEntity } from '../../entities/memory-point-details.entity.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import type { IMemoryPointGenerationFields } from '../../utils/generation-readiness.ts';
import { GetMemoryPointGenerationSourceQuery } from './get-memory-point-generation-source.query.ts';

@QueryHandler(GetMemoryPointGenerationSourceQuery)
export class GetMemoryPointGenerationSourceHandler
  implements
    IQueryHandler<
      GetMemoryPointGenerationSourceQuery,
      IMemoryPointGenerationFields
    >
{
  constructor(
    @InjectRepository(MemoryPointDetailsEntity)
    private readonly detailsRepository: Repository<MemoryPointDetailsEntity>,
  ) {}

  /**
   * Pure read: returns the generation-relevant fields (any may be null). The
   * readiness check + `missingFields` contract live in the generate command so
   * this query stays free of business rules. A missing details row still 404s.
   */
  async execute(
    query: GetMemoryPointGenerationSourceQuery,
  ): Promise<IMemoryPointGenerationFields> {
    const details = await this.detailsRepository
      .createQueryBuilder('details')
      .where('details.memoryPointId = :memoryPointId', {
        memoryPointId: query.memoryPointId,
      })
      .getOne();

    if (!details) {
      throw new MemoryPointNotFoundException();
    }

    return {
      sourcePhotoUrl: details.sourcePhotoUrl ?? null,
      sourceAudioUrl: details.sourceAudioUrl ?? null,
      title: details.title ?? null,
      description: details.description ?? null,
    };
  }
}
