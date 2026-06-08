import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { BaseDto } from '../../../common/dto/base.dto.ts';
import { NumberField } from '../../../decorators/field.decorators.ts';

export class GeoPointDto extends BaseDto {
  @Expose()
  @ApiProperty({ enum: ['Point'], example: 'Point' })
  type!: 'Point';

  @NumberField({ each: true, isArray: true })
  coordinates!: [number, number];
}
