import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { PageDto } from '../../../common/dto/page.dto.ts';
import { ApiPageResponse } from '../../../decorators/api-page-response.decorator.ts';
import {
  ApiUUIDParam,
  UUIDParam,
} from '../../../decorators/http.decorators.ts';
import { NearbyMemoryPointDto } from '../dtos/nearby-memory-point.dto.ts';
import { NearbyMemoryPointsPageOptionsDto } from '../dtos/nearby-memory-points-page-options.dto.ts';
import { PublicMemoryPointDto } from '../dtos/public-memory-point.dto.ts';
import { MemoryPointService } from '../memory-point.service.ts';

@Controller('memory-points')
@ApiTags('memory-points')
export class MemoryPointController {
  constructor(private readonly memoryPointService: MemoryPointService) {}

  @Get('nearby')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get approved memory points near a location',
  })
  @ApiPageResponse({
    description: 'Nearby approved memory points',
    type: NearbyMemoryPointDto,
  })
  async getNearby(
    @Query(new ValidationPipe({ transform: true }))
    pageOptionsDto: NearbyMemoryPointsPageOptionsDto,
  ): Promise<PageDto<NearbyMemoryPointDto>> {
    const page =
      await this.memoryPointService.getNearbyMemoryPoints(pageOptionsDto);

    return PageDto.create({
      data: page.data.map((memoryPoint) =>
        NearbyMemoryPointDto.create({
          id: memoryPoint.id,
          location: memoryPoint.location,
        }),
      ),
      meta: page.meta,
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single approved memory point' })
  @ApiUUIDParam('id')
  @ApiResponse({ status: HttpStatus.OK })
  getOnePublic(@UUIDParam('id') id: Uuid): Promise<PublicMemoryPointDto> {
    return this.memoryPointService.getMemoryPoint(id);
  }
}
