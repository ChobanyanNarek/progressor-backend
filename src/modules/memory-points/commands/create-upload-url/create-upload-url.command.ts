import { Command } from '@nestjs/cqrs';

import type { MemoryPointUploadUrlsDto } from '../../dtos/memory-point-upload-urls.dto.ts';
import type { RequestUploadUrlDto } from '../../dtos/request-upload-url.dto.ts';

export class CreateUploadUrlCommand extends Command<MemoryPointUploadUrlsDto> {
  constructor(
    public readonly memoryPointId: Uuid,
    public readonly userId: Uuid,
    public readonly requestUploadUrlDto: RequestUploadUrlDto,
  ) {
    super();
  }
}
