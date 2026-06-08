import { BaseDto } from '../../../common/dto/base.dto.ts';
import { NumberField } from '../../../decorators/field.decorators.ts';

/** Per-status memory point counts, one field per `MemoryPointStatus` value. */
export class MemoryPointStatusBreakdownDto extends BaseDto {
  @NumberField({ int: true })
  pending!: number;

  @NumberField({ int: true })
  adminReviewing!: number;

  @NumberField({ int: true })
  generating!: number;

  @NumberField({ int: true })
  aiReviewing!: number;

  @NumberField({ int: true })
  approved!: number;

  @NumberField({ int: true })
  rejected!: number;
}
