import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { PageDto } from '../../../../common/dto/page.dto.ts';
import { AdminAiJobDto } from '../../dtos/admin-ai-job.dto.ts';
import { MemoryPointAiGenerationEntity } from '../../memory-point-ai-generation.entity.ts';
import { GetAdminAiJobsQuery } from './get-admin-ai-jobs.query.ts';

@QueryHandler(GetAdminAiJobsQuery)
export class GetAdminAiJobsHandler
  implements IQueryHandler<GetAdminAiJobsQuery, PageDto<AdminAiJobDto>>
{
  constructor(
    @InjectRepository(MemoryPointAiGenerationEntity)
    private readonly aiGenerationRepository: Repository<MemoryPointAiGenerationEntity>,
  ) {}

  async execute(query: GetAdminAiJobsQuery): Promise<PageDto<AdminAiJobDto>> {
    const { pageOptionsDto } = query;

    /*
     * Join down to memory_point_details to pull the title in a single query
     * (avoids an N+1 per row). The generation entity owns a OneToOne to
     * memoryPoint; from there we reach its memoryPointDetails.
     */
    const queryBuilder = this.aiGenerationRepository
      .createQueryBuilder('gen')
      .leftJoinAndSelect('gen.memoryPoint', 'memoryPoint')
      .leftJoinAndSelect('memoryPoint.memoryPointDetails', 'details')
      .orderBy('gen.createdAt', pageOptionsDto.order);

    if (pageOptionsDto.status) {
      queryBuilder.andWhere('gen.status = :status', {
        status: pageOptionsDto.status,
      });
    }

    const [items, pageMetaDto] = await queryBuilder.paginate(pageOptionsDto);

    return PageDto.create({
      data: items.map((gen) =>
        AdminAiJobDto.create({
          id: gen.id,
          memoryPointId: gen.memoryPointId,
          memoryPointTitle: gen.memoryPoint.memoryPointDetails?.title ?? null,
          status: gen.status,
          didTalkId: gen.didTalkId,
          resultVideoUrl: gen.resultVideoUrl,
          errorMessage: gen.errorMessage,
          durationSeconds: gen.durationSeconds,
          attemptNumber: gen.attemptNumber,
          createdAt: gen.createdAt,
          updatedAt: gen.updatedAt,
        }),
      ),
      meta: pageMetaDto,
    });
  }
}
