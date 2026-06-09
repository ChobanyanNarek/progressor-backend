import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { MemoryPointDetailsEntity } from '../../entities/memory-point-details.entity.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { MemoryPointSourceNotUploadedException } from '../../exceptions/memory-point-source-not-uploaded.exception.ts';
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
     * Source columns are nullable at the schema level (an admin can create a
     * metadata-only details row before media exists). Generation, however, can
     * only run once both sources are present — guard so the returned contract
     * stays non-null.
     */
    if (!details.sourcePhotoUrl || !details.sourceAudioUrl) {
      throw new MemoryPointSourceNotUploadedException();
    }

    return {
      sourcePhotoUrl: details.sourcePhotoUrl,
      sourceAudioUrl: details.sourceAudioUrl,
    };
  }
}
