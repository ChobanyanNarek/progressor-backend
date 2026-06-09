import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { MemoryPointStatus } from '../../../../constants/memory-point-status.ts';
import { RoleType } from '../../../../constants/role-type.ts';
import { GcsStorageService } from '../../../../shared/services/gcs-storage.service.ts';
import type { MemoryPointDto } from '../../dtos/memory-point.dto.ts';
import { MemoryPointEntity } from '../../entities/memory-point.entity.ts';
import { MemoryPointNotFoundException } from '../../exceptions/memory-point-not-found.exception.ts';
import { GetMemoryPointQuery } from './get-memory-point.query.ts';

@QueryHandler(GetMemoryPointQuery)
export class GetMemoryPointHandler
  implements IQueryHandler<GetMemoryPointQuery, MemoryPointDto>
{
  constructor(
    @InjectRepository(MemoryPointEntity)
    private readonly memoryPointRepository: Repository<MemoryPointEntity>,
    private readonly gcsService: GcsStorageService,
  ) {}

  async execute(query: GetMemoryPointQuery): Promise<MemoryPointDto> {
    const { memoryPointId, userId, role } = query;

    const queryBuilder = this.memoryPointRepository
      .createQueryBuilder('mp')
      .leftJoinAndSelect('mp.memoryPointDetails', 'details')
      .leftJoinAndSelect('mp.user', 'user')
      .where('mp.id = :id', { id: memoryPointId });

    if (userId) {
      if (role === RoleType.CREATOR) {
        queryBuilder.andWhere('mp.userId = :userId', {
          userId,
        });
      }
    } else {
      queryBuilder.andWhere('mp.status = :status', {
        status: MemoryPointStatus.APPROVED,
      });
    }

    const memoryPointEntity = await queryBuilder.getOne();

    if (!memoryPointEntity) {
      throw new MemoryPointNotFoundException();
    }

    const shouldIncludeSourceUrls = role === RoleType.ADMIN;

    const dto = memoryPointEntity.toDto({
      includeSourceUrls: shouldIncludeSourceUrls,
    });

    /*
     * The details columns hold GCS object paths, not URLs — the bucket is
     * private, so the raw path 404s in the browser. Replace each with a
     * short-lived signed read URL the client can actually load, concurrently
     * (each is an independent IAM signBlob round-trip). videoUrl is always
     * exposed; the source URLs only when the admin opted into them above, so
     * non-admin responses keep omitting those keys rather than gaining nulls.
     *
     * We mutate the DTO in place here (rather than building via Dto.create({...})
     * like get-all / get-media) deliberately: the URLs are produced by toDto(),
     * which is synchronous and cannot await the signer, so signing has to happen
     * after construction (ADR-0008). Do NOT "normalize" this to a builder — there
     * is no entity-free way to rebuild the nested MemoryPointDetailsDto here.
     *
     * Signing videoUrl unconditionally is safe: the only writer of
     * details.videoUrl is apply-generation-result.handler, which stores the GCS
     * object path `generations/<mp>/<gen>/result.mp4` — never a full URL. (The
     * expiring full D-ID URL lives on a different column, generation.resultVideoUrl.)
     */
    const details = dto.memoryPointDetails;

    if (details) {
      if (shouldIncludeSourceUrls) {
        const [videoUrl, photoUrl, audioUrl] = await Promise.all([
          this.gcsService.getSignedReadUrlOrNull(details.videoUrl),
          this.gcsService.getSignedReadUrlOrNull(details.sourcePhotoUrl),
          this.gcsService.getSignedReadUrlOrNull(details.sourceAudioUrl),
        ]);

        details.videoUrl = videoUrl ?? undefined;
        details.sourcePhotoUrl = photoUrl;
        details.sourceAudioUrl = audioUrl;
      } else {
        const videoUrl = await this.gcsService.getSignedReadUrlOrNull(
          details.videoUrl,
        );

        details.videoUrl = videoUrl ?? undefined;
      }
    }

    return dto;
  }
}
