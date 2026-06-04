import { BaseDto } from '../../../common/dto/base.dto.ts';
import { MemoryPointStatus } from '../../../constants/memory-point-status.ts';
import { EnumField } from '../../../decorators/field.decorators.ts';

export class UpdateMemoryPointStatusDto extends BaseDto {
  @EnumField(() => MemoryPointStatus)
  readonly status!: MemoryPointStatus;
}
