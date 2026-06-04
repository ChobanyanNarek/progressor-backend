import { ApiProperty } from '@nestjs/swagger';

import { NumberField } from '../../../decorators/field.decorators.ts';

export class GeoPointDto {
  @ApiProperty({ enum: ['Point'], example: 'Point' })
  type!: 'Point';

  @NumberField({ each: true, isArray: true })
  coordinates!: [number, number];
}
