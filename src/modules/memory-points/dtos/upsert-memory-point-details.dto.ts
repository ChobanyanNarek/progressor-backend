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

  /**
   * The remaining content fields are optional, but the handler requires at least
   * one of {@link sourcePhotoUrl}, {@link sourceAudioUrl} or
   * {@link description} so a point carries some content (e.g. an AR point may be
   * text-only). Video generation still needs photo + audio + title +
   * description; the admin fills any gaps before generating.
   */
  @StringFieldOptional()
  readonly description?: string;

  @StringFieldOptional()
  readonly cloudAnchorId?: string;

  @EnumFieldOptional(() => MemoryPointType)
  readonly type?: MemoryPointType;

  @StringFieldOptional()
  readonly sourcePhotoUrl?: string;

  @StringFieldOptional()
  readonly sourceAudioUrl?: string;
}
