import { BaseDto } from '../../../common/dto/base.dto.ts';
import { ClassField } from '../../../decorators/field.decorators.ts';
import { RecentMemoryPointDto } from '../../memory-points/dtos/recent-memory-point.dto.ts';

/**
 * Envelope so the endpoint returns a `Dto` (not a bare array) per ADR-0016.
 */
export class RecentMemoryPointsDto extends BaseDto {
  @ClassField(() => RecentMemoryPointDto, { each: true, isArray: true })
  items!: RecentMemoryPointDto[];
}
