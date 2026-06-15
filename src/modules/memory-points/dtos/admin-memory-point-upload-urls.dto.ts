import { BaseDto } from '../../../common/dto/base.dto.ts';
import { ClassField } from '../../../decorators/field.decorators.ts';
import { UploadTargetDto } from './upload-target.dto.ts';

/**
 * Admin-side response carrying signed write URLs + object paths for replacing a
 * memory point's source media. Mirrors {@link MemoryPointUploadUrlsDto} (creator
 * flow) but is a distinct type so each endpoint owns its own DTO
 * (awesome-nest/unique-endpoint-dtos).
 */
export class AdminMemoryPointUploadUrlsDto extends BaseDto {
  @ClassField(() => UploadTargetDto)
  photo!: UploadTargetDto;

  @ClassField(() => UploadTargetDto)
  audio!: UploadTargetDto;
}
