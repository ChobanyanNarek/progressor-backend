import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { MemoryPointDetailsEntity } from '../../entities/memory-point-details.entity.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { MemoryPointNotReadyForGenerationException } from '../../exceptions/memory-point-not-ready-for-generation.exception.ts';
import {
  GetMemoryPointGenerationSourceQuery,
  type MemoryPointGenerationSource,
} from './get-memory-point-generation-source.query.ts';

@QueryHandler(GetMemoryPointGenerationSourceQuery)
export class GetMemoryPointGenerationSourceHandler
  implements
    IQueryHandler<
      GetMemoryPointGenerationSourceQuery,
      MemoryPointGenerationSource
    >
{
  constructor(
    @InjectRepository(MemoryPointDetailsEntity)
    private readonly detailsRepository: Repository<MemoryPointDetailsEntity>,
  ) {}

  async execute(
    query: GetMemoryPointGenerationSourceQuery,
  ): Promise<MemoryPointGenerationSource> {
    const details = await this.detailsRepository
      .createQueryBuilder('details')
      .where('details.memoryPointId = :memoryPointId', {
        memoryPointId: query.memoryPointId,
      })
      .getOne();

    if (!details) {
      throw new MemoryPointNotFoundException();
    }

    /*
     * Every required field is nullable at the schema level (an admin can create
     * a metadata-only details row before media/text exists). Generation can only
     * run once the full set is present — collect every missing field in one pass
     * so the admin frontend can surface them all at once, and so the returned
     * source contract stays non-null.
     */
    const missingFields: string[] = [];

    if (!details.sourcePhotoUrl) {
      missingFields.push('sourcePhotoUrl');
    }

    if (!details.sourceAudioUrl) {
      missingFields.push('sourceAudioUrl');
    }

    if (!details.title) {
      missingFields.push('title');
    }

    if (!details.description) {
      missingFields.push('description');
    }

    if (missingFields.length > 0) {
      throw new MemoryPointNotReadyForGenerationException(missingFields);
    }

    // Non-null by the guard above; assert to satisfy the non-null return contract.
    return {
      sourcePhotoUrl: details.sourcePhotoUrl!,
      sourceAudioUrl: details.sourceAudioUrl!,
    };
  }
}
