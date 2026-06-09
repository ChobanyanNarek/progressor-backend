import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import type { PageDto } from '../../../common/dto/page.dto.ts';
import { RoleType } from '../../../constants/role-type.ts';
import { ApiPageResponse } from '../../../decorators/api-page-response.decorator.ts';
import { Auth } from '../../../decorators/http.decorators.ts';
import { AdminAiJobDto } from '../dtos/admin-ai-job.dto.ts';
import { AdminAiJobOptionsDto } from '../dtos/admin-ai-job-options.dto.ts';
import { MemoryPointAiGenerationService } from '../services/memory-point-ai-generation.service.ts';

@Controller('admin/jobs')
@ApiTags('admin-ai-jobs')
export class AdminAiJobController {
  constructor(
    private readonly aiGenerationService: MemoryPointAiGenerationService,
  ) {}

  @Get()
  @Auth([RoleType.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List AI generation jobs across all memory points' })
  @ApiPageResponse({
    description: 'AI generation jobs',
    type: AdminAiJobDto,
  })
  getAll(
    @Query(new ValidationPipe({ transform: true }))
    pageOptionsDto: AdminAiJobOptionsDto,
  ): Promise<PageDto<AdminAiJobDto>> {
    return this.aiGenerationService.getAdminJobs(pageOptionsDto);
  }
}
