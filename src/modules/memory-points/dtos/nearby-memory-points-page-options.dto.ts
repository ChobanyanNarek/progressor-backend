import { PageOptionsDto } from '../../../common/dto/page-options.dto.ts';
import { NumberField } from '../../../decorators/field.decorators.ts';

/*
 * Title search uses the inherited `q` param (consistent with every other list
 * endpoint); results are ordered by distance, so `order` is not consumed here.
 */
export class NearbyMemoryPointsPageOptionsDto extends PageOptionsDto {
  @NumberField({ min: -90, max: 90 })
  readonly latitude!: number;

  @NumberField({ min: -180, max: 180 })
  readonly longitude!: number;

  @NumberField({ min: 100, max: 50_000, default: 5000 })
  readonly radiusMeters!: number;
}
