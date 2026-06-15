import { Command } from '@nestjs/cqrs';

import type { AdminMemoryPointUploadUrlsDto } from '../../dtos/admin-memory-point-upload-urls.dto.ts';
import type { RequestAdminUploadUrlDto } from '../../dtos/request-admin-upload-url.dto.ts';

/**
 * Admin-side counterpart of {@link CreateUploadUrlCommand}: issues signed write
 * URLs so an admin can replace a memory point's source media before
 * (re)generation. Unlike the creator command there is no owner check (admins
 * act on any point), and the editable window is `ADMIN_REVIEWING`/`REJECTED`
 * rather than `PENDING`.
 */
export class CreateAdminUploadUrlCommand extends Command<AdminMemoryPointUploadUrlsDto> {
  constructor(
    public readonly memoryPointId: Uuid,
    public readonly requestUploadUrlDto: RequestAdminUploadUrlDto,
  ) {
    super();
  }
}
