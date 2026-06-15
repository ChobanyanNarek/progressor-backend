import { BaseDto } from '../../../common/dto/base.dto.ts';
import { AudioFileType } from '../../../constants/audio-file-type.ts';
import { PhotoFileType } from '../../../constants/photo-file-type.ts';
import { EnumField } from '../../../decorators/field.decorators.ts';

/**
 * Admin-side request body for replacing a memory point's source media. Mirrors
 * {@link RequestUploadUrlDto} (creator flow) but is a distinct type so each
 * endpoint owns its own DTO (awesome-nest/unique-endpoint-dtos).
 */
export class RequestAdminUploadUrlDto extends BaseDto {
  @EnumField(() => PhotoFileType, { example: PhotoFileType.JPG })
  readonly photoContentType!: PhotoFileType;

  @EnumField(() => AudioFileType, { example: AudioFileType.MP3 })
  readonly audioContentType!: AudioFileType;
}
