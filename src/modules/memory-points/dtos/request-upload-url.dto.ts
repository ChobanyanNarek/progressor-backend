import { BaseDto } from '../../../common/dto/base.dto.ts';
import { AudioFileType } from '../../../constants/audio-file-type.ts';
import { PhotoFileType } from '../../../constants/photo-file-type.ts';
import { EnumField } from '../../../decorators/field.decorators.ts';

export class RequestUploadUrlDto extends BaseDto {
  @EnumField(() => PhotoFileType, { example: PhotoFileType.JPG })
  readonly photoContentType!: PhotoFileType;

  @EnumField(() => AudioFileType, { example: AudioFileType.MP3 })
  readonly audioContentType!: AudioFileType;
}
