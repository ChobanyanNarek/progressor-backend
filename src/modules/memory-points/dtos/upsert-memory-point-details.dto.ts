import { BaseDto } from '../../../common/dto/base.dto.ts';
import { MemoryPointType } from '../../../constants/memory-point-type.ts';
import {
  EnumFieldOptional,
  StringField,
  StringFieldOptional,
} from '../../../decorators/field.decorators.ts';

export class UpsertMemoryPointDetailsDto extends BaseDto {
  @StringField()
  readonly sourcePhotoUrl!: string;

  @StringField()
  readonly sourceAudioUrl!: string;

  @StringFieldOptional()
  readonly title?: string;

  @StringFieldOptional()
  readonly description?: string;

  @StringFieldOptional()
  readonly cloudAnchorId?: string;

  @EnumFieldOptional(() => MemoryPointType)
  readonly type?: MemoryPointType;
}
