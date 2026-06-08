import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import type { PageDto } from '../../common/dto/page.dto.ts';
import { PageOptionsDto } from '../../common/dto/page-options.dto.ts';
import { RoleType } from '../../constants/role-type.ts';
import { ApiPageResponse } from '../../decorators/api-page-response.decorator.ts';
import { Auth } from '../../decorators/http.decorators.ts';
import { MediaItemDto } from '../memory-points/dtos/media-item.dto.ts';
import { MemoryPointService } from '../memory-points/memory-point.service.ts';

@Controller('admin/media')
@ApiTags('admin-media')
export class AdminMediaController {
  constructor(private readonly memoryPointService: MemoryPointService) {}

  @Get()
  @Auth([RoleType.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List uploaded media across memory points' })
  @ApiPageResponse({ description: 'Media items', type: MediaItemDto })
  getAll(
    @Query(new ValidationPipe({ transform: true }))
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<MediaItemDto>> {
    return this.memoryPointService.getMedia(pageOptionsDto);
  }
}
