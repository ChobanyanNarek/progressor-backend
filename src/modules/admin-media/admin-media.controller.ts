import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { PageDto } from '../../common/dto/page.dto.ts';
import { PageOptionsDto } from '../../common/dto/page-options.dto.ts';
import { RoleType } from '../../constants/role-type.ts';
import { ApiPageResponse } from '../../decorators/api-page-response.decorator.ts';
import { Auth } from '../../decorators/http.decorators.ts';
import { MemoryPointService } from '../memory-points/memory-point.service.ts';
import { MediaItemDto } from './dtos/media-item.dto.ts';

@Controller('admin/media')
@ApiTags('admin-media')
export class AdminMediaController {
  constructor(private readonly memoryPointService: MemoryPointService) {}

  @Get()
  @Auth([RoleType.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List uploaded media across memory points' })
  @ApiPageResponse({ description: 'Media items', type: MediaItemDto })
  async getAll(
    @Query(new ValidationPipe({ transform: true }))
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<MediaItemDto>> {
    const page = await this.memoryPointService.getMedia(pageOptionsDto);

    return PageDto.create({
      data: page.data.map((item) =>
        MediaItemDto.create({
          id: item.id,
          memoryPointId: item.memoryPointId,
          title: item.title,
          type: item.type,
          status: item.status,
          photoUrl: item.photoUrl,
          audioUrl: item.audioUrl,
          videoUrl: item.videoUrl,
          createdAt: item.createdAt,
        }),
      ),
      meta: page.meta,
    });
  }
}
