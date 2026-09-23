import type { AbstractEntity } from '../../../common/abstract.entity.ts';
import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import {
  NumberField,
  StringField,
} from '../../../decorators/field.decorators.ts';

interface ITombstoneShape {
  recordId: string;
  revision: number;
}

export class PmTrackerTombstoneDto extends AbstractDto {
  @StringField()
  recordId!: string;

  @NumberField({ int: true })
  revision!: number;

  constructor(entity: AbstractEntity & ITombstoneShape) {
    super(entity);
    this.recordId = entity.recordId;
    this.revision = entity.revision;
  }
}
