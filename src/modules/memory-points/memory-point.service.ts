import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import type { PageDto } from '../../common/dto/page.dto.ts';
import type { PageOptionsDto } from '../../common/dto/page-options.dto.ts';
import type { MemoryPointStatus } from '../../constants/memory-point-status.ts';
import type { PublicationState } from '../../constants/publication-state.ts';
import type { RoleType } from '../../constants/role-type.ts';
import type { AiGenerationStatusResponseDto } from '../memory-point-ai-generation/dtos/ai-generation-status.dto.ts';
import type { MemoryPointAiGenerationDto } from '../memory-point-ai-generation/dtos/memory-point-ai-generation.dto.ts';
import { MemoryPointAiGenerationService } from '../memory-point-ai-generation/services/memory-point-ai-generation.service.ts';
import { ArchiveMemoryPointCommand } from './commands/archive-memory-point/archive-memory-point.command.ts';
import { CreateAdminUploadUrlCommand } from './commands/create-admin-upload-url/create-admin-upload-url.command.ts';
import { CreateMemoryPointCommand } from './commands/create-memory-point/create-memory-point.command.ts';
import { CreateUploadUrlCommand } from './commands/create-upload-url/create-upload-url.command.ts';
import { DeactivateMemoryPointCommand } from './commands/deactivate-memory-point/deactivate-memory-point.command.ts';
import { DeleteMemoryPointCommand } from './commands/delete-memory-point/delete-memory-point.command.ts';
import { UpdateMemoryPointDetailsCommand } from './commands/update-memory-point-details/update-memory-point-details.command.ts';
import {
  type LocationActor,
  UpdateMemoryPointLocationCommand,
} from './commands/update-memory-point-location/update-memory-point-location.command.ts';
import { UpdateMemoryPointStatusCommand } from './commands/update-memory-point-status/update-memory-point-status.command.ts';
import { UpdatePublicationStateCommand } from './commands/update-publication-state/update-publication-state.command.ts';
import { UpsertMemoryPointDetailsCommand } from './commands/upsert-memory-point-details/upsert-memory-point-details.command.ts';
import type { AdminMemoryPointListItemDto } from './dtos/admin-memory-point-list-item.dto.ts';
import type { AdminMemoryPointUploadUrlsDto } from './dtos/admin-memory-point-upload-urls.dto.ts';
import type { CreateMemoryPointDto } from './dtos/create-memory-point.dto.ts';
import type { MediaItemDto } from './dtos/media-item.dto.ts';
import type { MemoryPointDto } from './dtos/memory-point.dto.ts';
import type { MemoryPointDetailsDto } from './dtos/memory-point-details.dto.ts';
import type { MemoryPointStatsDto } from './dtos/memory-point-stats.dto.ts';
import type { MemoryPointUploadUrlsDto } from './dtos/memory-point-upload-urls.dto.ts';
import type { MyMemoryPointDto } from './dtos/my-memory-point.dto.ts';
import type { NearbyMemoryPointDto } from './dtos/nearby-memory-point.dto.ts';
import type { NearbyMemoryPointsPageOptionsDto } from './dtos/nearby-memory-points-page-options.dto.ts';
import type { RecentMemoryPointDto } from './dtos/recent-memory-point.dto.ts';
import type { RequestAdminUploadUrlDto } from './dtos/request-admin-upload-url.dto.ts';
import type { RequestUploadUrlDto } from './dtos/request-upload-url.dto.ts';
import type { SearchMemoryPointDto } from './dtos/search-memory-point.dto.ts';
import type { SearchMemoryPointsPageOptionsDto } from './dtos/search-memory-points-page-options.dto.ts';
import type { UpdateMemoryPointDetailsDto } from './dtos/update-memory-point-details.dto.ts';
import type { UpdateMemoryPointLocationDto } from './dtos/update-memory-point-location.dto.ts';
import type { UpsertMemoryPointDetailsDto } from './dtos/upsert-memory-point-details.dto.ts';
import { GetAllMemoryPointsQuery } from './queries/get-all-memory-points/get-all-memory-points.query.ts';
import { GetMediaQuery } from './queries/get-media/get-media.query.ts';
import { GetMemoryPointQuery } from './queries/get-memory-point/get-memory-point.query.ts';
import { GetMemoryPointStatsQuery } from './queries/get-memory-point-stats/get-memory-point-stats.query.ts';
import { GetMyMemoryPointsQuery } from './queries/get-my-memory-points/get-my-memory-points.query.ts';
import { GetNearbyMemoryPointsQuery } from './queries/get-nearby-memory-points/get-nearby-memory-points.query.ts';
import { GetRecentMemoryPointsQuery } from './queries/get-recent-memory-points/get-recent-memory-points.query.ts';
import { SearchMemoryPointsQuery } from './queries/search-memory-points/search-memory-points.query.ts';

@Injectable()
export class MemoryPointService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly aiGenerationService: MemoryPointAiGenerationService,
  ) {}

  createMemoryPoint(
    userId: Uuid,
    dto: CreateMemoryPointDto,
  ): Promise<MemoryPointDto> {
    return this.commandBus.execute<CreateMemoryPointCommand, MemoryPointDto>(
      new CreateMemoryPointCommand(userId, dto),
    );
  }

  getMemoryPoint(
    memoryPointId: Uuid,
    userId?: Uuid,
    role?: RoleType,
  ): Promise<MemoryPointDto> {
    return this.queryBus.execute<GetMemoryPointQuery, MemoryPointDto>(
      new GetMemoryPointQuery(memoryPointId, userId, role),
    );
  }

  getMyMemoryPoints(
    userId: Uuid,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<MyMemoryPointDto>> {
    return this.queryBus.execute<
      GetMyMemoryPointsQuery,
      PageDto<MyMemoryPointDto>
    >(new GetMyMemoryPointsQuery(userId, pageOptionsDto));
  }

  getStats(): Promise<MemoryPointStatsDto> {
    return this.queryBus.execute<GetMemoryPointStatsQuery, MemoryPointStatsDto>(
      new GetMemoryPointStatsQuery(),
    );
  }

  getRecent(limit: number): Promise<RecentMemoryPointDto[]> {
    return this.queryBus.execute<
      GetRecentMemoryPointsQuery,
      RecentMemoryPointDto[]
    >(new GetRecentMemoryPointsQuery(limit));
  }

  getMedia(pageOptionsDto: PageOptionsDto): Promise<PageDto<MediaItemDto>> {
    return this.queryBus.execute<GetMediaQuery, PageDto<MediaItemDto>>(
      new GetMediaQuery(pageOptionsDto),
    );
  }

  getAllMemoryPoints(
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<AdminMemoryPointListItemDto>> {
    return this.queryBus.execute<
      GetAllMemoryPointsQuery,
      PageDto<AdminMemoryPointListItemDto>
    >(new GetAllMemoryPointsQuery(pageOptionsDto));
  }

  getNearbyMemoryPoints(
    pageOptionsDto: NearbyMemoryPointsPageOptionsDto,
  ): Promise<PageDto<NearbyMemoryPointDto>> {
    return this.queryBus.execute<
      GetNearbyMemoryPointsQuery,
      PageDto<NearbyMemoryPointDto>
    >(new GetNearbyMemoryPointsQuery(pageOptionsDto));
  }

  searchMemoryPoints(
    pageOptionsDto: SearchMemoryPointsPageOptionsDto,
  ): Promise<PageDto<SearchMemoryPointDto>> {
    return this.queryBus.execute<
      SearchMemoryPointsQuery,
      PageDto<SearchMemoryPointDto>
    >(new SearchMemoryPointsQuery(pageOptionsDto));
  }

  updateMemoryPointLocation(
    memoryPointId: Uuid,
    dto: UpdateMemoryPointLocationDto,
    actor: LocationActor,
  ): Promise<void> {
    return this.commandBus.execute<UpdateMemoryPointLocationCommand>(
      new UpdateMemoryPointLocationCommand(
        memoryPointId,
        dto.latitude,
        dto.longitude,
        actor,
      ),
    );
  }

  updateStatus(
    memoryPointId: Uuid,
    status: MemoryPointStatus,
    actorId: Uuid,
  ): Promise<void> {
    return this.commandBus.execute<UpdateMemoryPointStatusCommand>(
      new UpdateMemoryPointStatusCommand(memoryPointId, status, actorId),
    );
  }

  updateDetails(
    memoryPointId: Uuid,
    dto: UpdateMemoryPointDetailsDto,
    actorId: Uuid,
  ): Promise<void> {
    return this.commandBus.execute<UpdateMemoryPointDetailsCommand>(
      new UpdateMemoryPointDetailsCommand(memoryPointId, dto, actorId),
    );
  }

  updatePublicationState(
    memoryPointId: Uuid,
    publicationState: PublicationState,
  ): Promise<void> {
    return this.commandBus.execute<UpdatePublicationStateCommand>(
      new UpdatePublicationStateCommand(memoryPointId, publicationState),
    );
  }

  archiveMemoryPoint(memoryPointId: Uuid): Promise<void> {
    return this.commandBus.execute<ArchiveMemoryPointCommand>(
      new ArchiveMemoryPointCommand(memoryPointId),
    );
  }

  deactivateMemoryPoint(memoryPointId: Uuid, userId: Uuid): Promise<void> {
    return this.commandBus.execute<DeactivateMemoryPointCommand>(
      new DeactivateMemoryPointCommand(memoryPointId, userId),
    );
  }

  deleteMemoryPoint(memoryPointId: Uuid, actorId: Uuid): Promise<void> {
    return this.commandBus.execute<DeleteMemoryPointCommand>(
      new DeleteMemoryPointCommand(memoryPointId, actorId),
    );
  }

  upsertDetails(
    memoryPointId: Uuid,
    userId: Uuid,
    upsertMemoryPointDetailsDto: UpsertMemoryPointDetailsDto,
  ): Promise<MemoryPointDetailsDto> {
    return this.commandBus.execute<UpsertMemoryPointDetailsCommand>(
      new UpsertMemoryPointDetailsCommand(
        memoryPointId,
        userId,
        upsertMemoryPointDetailsDto,
      ),
    );
  }

  createUploadUrls(
    memoryPointId: Uuid,
    userId: Uuid,
    requestUploadUrlDto: RequestUploadUrlDto,
  ): Promise<MemoryPointUploadUrlsDto> {
    return this.commandBus.execute<
      CreateUploadUrlCommand,
      MemoryPointUploadUrlsDto
    >(new CreateUploadUrlCommand(memoryPointId, userId, requestUploadUrlDto));
  }

  createAdminUploadUrls(
    memoryPointId: Uuid,
    requestUploadUrlDto: RequestAdminUploadUrlDto,
  ): Promise<AdminMemoryPointUploadUrlsDto> {
    return this.commandBus.execute<
      CreateAdminUploadUrlCommand,
      AdminMemoryPointUploadUrlsDto
    >(new CreateAdminUploadUrlCommand(memoryPointId, requestUploadUrlDto));
  }

  generateVideo(memoryPointId: Uuid): Promise<MemoryPointAiGenerationDto> {
    return this.aiGenerationService.generate(memoryPointId);
  }

  getVideoStatus(
    memoryPointId: Uuid,
    userId: Uuid,
    role: RoleType,
  ): Promise<AiGenerationStatusResponseDto> {
    return this.aiGenerationService.getStatus(memoryPointId, userId, role);
  }
}
