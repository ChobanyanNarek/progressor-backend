import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import type { UserEntity } from '../../user/user.entity.ts';
import { CreateMemoryPointDto } from '../dtos/create-memory-point.dto.ts';
import { MemoryPointDto } from '../dtos/memory-point.dto.ts';
import { MemoryPointDetailsDto } from '../dtos/memory-point-details.dto.ts';
import { MyMemoryPointDto } from '../dtos/my-memory-point.dto.ts';
import { UpsertMemoryPointDetailsDto } from '../dtos/upsert-memory-point-details.dto.ts';
import { MemoryPointService } from '../memory-point.service.ts';

@Controller('creator/memory-points')
@ApiTags('creator-memory-points')
export class CreatorMemoryPointController {
  constructor(private readonly memoryPointService: MemoryPointService) {}

  @Post()
  @Auth([RoleType.CREATOR])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new memory point' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: MemoryPointDto,
  })
  create(
    @AuthUser() user: UserEntity,
    @Body() createMemoryPointDto: CreateMemoryPointDto,
  ): Promise<MemoryPointDto> {
    return this.memoryPointService.createMemoryPoint(
      user.id,
      createMemoryPointDto,
    );
  }

  @Post(':id/details')
  @Auth([RoleType.CREATOR])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Upsert memory point details and AI-generation input; the point stays PENDING until an admin picks it up',
  })
  @ApiUUIDParam('id')
  @ApiResponse({ status: HttpStatus.OK, type: MemoryPointDetailsDto })
  upsertDetails(
    @UUIDParam('id') id: Uuid,
    @AuthUser() user: UserEntity,
    @Body() upsertMemoryPointDetailsDto: UpsertMemoryPointDetailsDto,
  ): Promise<MemoryPointDetailsDto> {
    return this.memoryPointService.upsertDetails(
      id,
      user.id,
      upsertMemoryPointDetailsDto,
    );
  }

  @Get('mine')
  @Auth([RoleType.CREATOR])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get my memory points' })
  @ApiPageResponse({
    description: 'My memory points',
    type: MyMemoryPointDto,
  })
  async getMyMemoryPoints(
    @AuthUser() user: UserEntity,
    @Query(new ValidationPipe({ transform: true }))
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<MyMemoryPointDto>> {
    const page = await this.memoryPointService.getMyMemoryPoints(
      user.id,
      pageOptionsDto,
    );

    return new PageDto(
      page.data.map((memoryPoint) =>
        MyMemoryPointDto.create({
          id: memoryPoint.id,
          location: memoryPoint.location,
          status: memoryPoint.status,
        }),
      ),
      page.meta,
    );
  }

  @Get(':id')
  @Auth([RoleType.CREATOR])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a single memory point by ID',
  })
  @ApiUUIDParam('id')
  @ApiResponse({ status: HttpStatus.OK, type: MemoryPointDto })
  getOne(
    @UUIDParam('id') id: Uuid,
    @AuthUser() user: UserEntity,
  ): Promise<MemoryPointDto> {
    return this.memoryPointService.getMemoryPoint(id, user.id, user.role);
  }
}
