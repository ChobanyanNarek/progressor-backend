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
}
