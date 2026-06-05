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
import { MemoryPointDto } from '../dtos/memory-point.dto.ts';
import { NearbyMemoryPointDto } from '../dtos/nearby-memory-point.dto.ts';
import { NearbyMemoryPointsPageOptionsDto } from '../dtos/nearby-memory-points-page-options.dto.ts';
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

    return new PageDto(
      page.data.map((memoryPoint) =>
        NearbyMemoryPointDto.create({
          id: memoryPoint.id,
          location: memoryPoint.location,
        }),
      ),
      page.meta,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single approved memory point' })
  @ApiUUIDParam('id')
  @ApiResponse({ status: HttpStatus.OK, type: MemoryPointDto })
  getOnePublic(@UUIDParam('id') id: Uuid): Promise<MemoryPointDto> {
    return this.memoryPointService.getMemoryPoint(id);
  }
}
