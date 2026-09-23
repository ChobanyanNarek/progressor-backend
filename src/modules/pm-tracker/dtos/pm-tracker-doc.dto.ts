import { Expose } from 'class-transformer';

import type { AbstractEntity } from '../../../common/abstract.entity.ts';
import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import {
  NumberField,
  StringField,
} from '../../../decorators/field.decorators.ts';

interface IDocShape {
  key: string;
  data: unknown;
  revision: number;
}

export class PmTrackerDocDto extends AbstractDto {
  @StringField()
  key!: string;

  @Expose()
  data!: unknown;

  @NumberField({ int: true })
  revision!: number;

  constructor(entity: AbstractEntity & IDocShape) {
    super(entity);
    this.key = entity.key;
    this.data = entity.data;
    this.revision = entity.revision;
  }
}
