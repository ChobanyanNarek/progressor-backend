import { PageOptionsDto } from '../../../common/dto/page-options.dto.ts';
import { LogLevel } from '../../../constants/log-level.ts';
import { LogSource } from '../../../constants/log-source.ts';
import {
  DateFieldOptional,
  EnumFieldOptional,
  UUIDFieldOptional,
} from '../../../decorators/field.decorators.ts';
import { IsDateAfterOrEqual } from '../../../decorators/validator.decorators.ts';

export class AdminLogOptionsDto extends PageOptionsDto {
  @EnumFieldOptional(() => LogLevel)
  readonly level?: LogLevel;

  @EnumFieldOptional(() => LogSource)
  readonly source?: LogSource;

  // Filter logs correlated to a specific memory point (PRD A11).
  @UUIDFieldOptional()
  readonly memoryPointId?: Uuid;

  // Inclusive lower bound of the timestamp window (ISO 8601).
  @DateFieldOptional()
  readonly from?: Date;

  // Inclusive upper bound of the timestamp window (ISO 8601); must be >= from.
  @DateFieldOptional()
  @IsDateAfterOrEqual('from')
  readonly to?: Date;
}
