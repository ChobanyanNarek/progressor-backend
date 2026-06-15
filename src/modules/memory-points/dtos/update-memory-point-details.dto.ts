import { BaseDto } from '../../../common/dto/base.dto.ts';
import { MemoryPointType } from '../../../constants/memory-point-type.ts';
import {
  EnumFieldOptional,
  StringFieldOptional,
} from '../../../decorators/field.decorators.ts';

export class UpdateMemoryPointDetailsDto extends BaseDto {
  @StringFieldOptional()
  readonly title?: string;

  @StringFieldOptional()
  readonly description?: string;

  @StringFieldOptional()
  readonly cloudAnchorId?: string;

  @EnumFieldOptional(() => MemoryPointType)
  readonly type?: MemoryPointType;

  /**
   * GCS object path of a replacement source photo, obtained from the admin
   * upload-url endpoint after the bytes have been PUT. Only set when the admin
   * is swapping the media.
   */
  @StringFieldOptional()
  readonly sourcePhotoUrl?: string;

  /** GCS object path of a replacement source audio (see {@link sourcePhotoUrl}). */
  @StringFieldOptional()
  readonly sourceAudioUrl?: string;
}
