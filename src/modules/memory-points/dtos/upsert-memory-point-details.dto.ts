import { BaseDto } from '../../../common/dto/base.dto.ts';
import { MemoryPointType } from '../../../constants/memory-point-type.ts';
import {
  EnumFieldOptional,
  StringField,
  StringFieldOptional,
} from '../../../decorators/field.decorators.ts';

export class UpsertMemoryPointDetailsDto extends BaseDto {
  /** Title is always required. */
  @StringField()
  readonly title!: string;

  /** A face photo is always required (object path from the upload-url flow). */
  @StringField()
  readonly sourcePhotoUrl!: string;

  /**
   * The rest are optional. For video generation the admin additionally needs a
   * script — either a description (D-ID TTS) or an uploaded voice
   * ({@link sourceAudioUrl}) — but neither is required to submit.
   */
  @StringFieldOptional()
  readonly description?: string;

  @StringFieldOptional()
  readonly cloudAnchorId?: string;

  @EnumFieldOptional(() => MemoryPointType)
  readonly type?: MemoryPointType;

  @StringFieldOptional()
  readonly sourceAudioUrl?: string;
}
