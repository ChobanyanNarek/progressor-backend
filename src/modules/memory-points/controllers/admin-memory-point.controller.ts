import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { PageDto } from '../../../common/dto/page.dto.ts';
import { PageOptionsDto } from '../../../common/dto/page-options.dto.ts';
import { RoleType } from '../../../constants/role-type.ts';
import { ApiPageResponse } from '../../../decorators/api-page-response.decorator.ts';
import { AuthUser } from '../../../decorators/auth-user.decorator.ts';
import {
  ApiUUIDParam,
  Auth,
  UUIDParam,
} from '../../../decorators/http.decorators.ts';
import { AiGenerationStatusResponseDto } from '../../memory-point-ai-generation/dtos/ai-generation-status.dto.ts';
import { MemoryPointAiGenerationDto } from '../../memory-point-ai-generation/dtos/memory-point-ai-generation.dto.ts';
import type { UserEntity } from '../../user/user.entity.ts';
import { AdminMemoryPointListItemDto } from '../dtos/admin-memory-point-list-item.dto.ts';
import { MemoryPointDto } from '../dtos/memory-point.dto.ts';
import { UpdateMemoryPointDetailsDto } from '../dtos/update-memory-point-details.dto.ts';
import { UpdateMemoryPointStatusDto } from '../dtos/update-memory-point-status.dto.ts';
import { UpdatePublicationStateDto } from '../dtos/update-publication-state.dto.ts';
import { MemoryPointService } from '../memory-point.service.ts';

@Controller('admin/memory-points')
@ApiTags('admin-memory-points')
export class AdminMemoryPointController {
  constructor(private readonly memoryPointService: MemoryPointService) {}

  @Get()
  @Auth([RoleType.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all memory points' })
  @ApiPageResponse({
    description: 'All memory points',
    type: AdminMemoryPointListItemDto,
  })
  getAll(
    @Query(new ValidationPipe({ transform: true }))
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<AdminMemoryPointListItemDto>> {
    return this.memoryPointService.getAllMemoryPoints(pageOptionsDto);
  }

  @Get(':id')
  @Auth([RoleType.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single memory point by ID' })
  @ApiUUIDParam('id')
  @ApiResponse({
    status: HttpStatus.OK,
    // eslint-disable-next-line awesome-nest/unique-endpoint-dtos
    type: MemoryPointDto,
  })
  getOne(
    @UUIDParam('id') id: Uuid,
    @AuthUser() user: UserEntity,
  ): Promise<MemoryPointDto> {
    return this.memoryPointService.getMemoryPoint(id, user.id, user.role);
  }

  @Patch(':id/status')
  @Auth([RoleType.ADMIN])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update memory point status' })
  @ApiUUIDParam('id')
  updateStatus(
    @UUIDParam('id') id: Uuid,
    @Body() updateMemoryPointStatusDto: UpdateMemoryPointStatusDto,
  ): Promise<void> {
    return this.memoryPointService.updateStatus(
      id,
      updateMemoryPointStatusDto.status,
    );
  }

  @Patch(':id/publication-state')
  @Auth([RoleType.ADMIN])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Set publication state (ACTIVE / INACTIVE / ARCHIVED) on a memory point',
  })
  @ApiUUIDParam('id')
  updatePublicationState(
    @UUIDParam('id') id: Uuid,
    @Body() updatePublicationStateDto: UpdatePublicationStateDto,
  ): Promise<void> {
    return this.memoryPointService.updatePublicationState(
      id,
      updatePublicationStateDto.publicationState,
    );
  }

  @Patch(':id/archive')
  @Auth([RoleType.ADMIN])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Soft-archive a memory point (sets publicationState=ARCHIVED and stamps deletedAt)',
  })
  @ApiUUIDParam('id')
  archive(@UUIDParam('id') id: Uuid): Promise<void> {
    return this.memoryPointService.archiveMemoryPoint(id);
  }

  @Delete(':id')
  @Auth([RoleType.ADMIN])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard-delete a memory point (permanent removal)' })
  @ApiUUIDParam('id')
  delete(@UUIDParam('id') id: Uuid): Promise<void> {
    return this.memoryPointService.deleteMemoryPoint(id);
  }

  @Patch(':id/details')
  @Auth([RoleType.ADMIN])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Update editable memory point details',
  })
  @ApiUUIDParam('id')
  updateDetails(
    @UUIDParam('id') id: Uuid,
    @Body() updateMemoryPointDetailsDto: UpdateMemoryPointDetailsDto,
  ): Promise<void> {
    return this.memoryPointService.updateDetails(
      id,
      updateMemoryPointDetailsDto,
    );
  }

  @Post(':id/generate-video')
  @Auth([RoleType.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send a reviewed memory point to D-ID for video generation',
  })
  @ApiUUIDParam('id')
  @ApiResponse({
    status: HttpStatus.OK,
    // eslint-disable-next-line awesome-nest/unique-endpoint-dtos
    type: MemoryPointAiGenerationDto,
  })
  generateVideo(
    @UUIDParam('id') id: Uuid,
  ): Promise<MemoryPointAiGenerationDto> {
    return this.memoryPointService.generateVideo(id);
  }

  @Get(':id/video-status')
  @Auth([RoleType.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get AI video generation status' })
  @ApiUUIDParam('id')
  @ApiResponse({
    status: HttpStatus.OK,
    // eslint-disable-next-line awesome-nest/unique-endpoint-dtos
    type: AiGenerationStatusResponseDto,
  })
  getVideoStatus(
    @UUIDParam('id') id: Uuid,
    @AuthUser() user: UserEntity,
  ): Promise<AiGenerationStatusResponseDto> {
    return this.memoryPointService.getVideoStatus(id, user.id, user.role);
  }
}
