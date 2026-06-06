import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '../../../common/dto/base.dto.ts';
import { NumberField } from '../../../decorators/field.decorators.ts';

export class GeoPointDto extends BaseDto {
  @ApiProperty({ enum: ['Point'], example: 'Point' })
  type!: 'Point';

  @NumberField({ each: true, isArray: true })
  coordinates!: [number, number];
}
