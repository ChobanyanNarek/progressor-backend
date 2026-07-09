import type { AbstractEntity } from '../../../common/abstract.entity.ts';
import { AbstractDto } from '../../../common/dto/abstract.dto.ts';

export class SavePmTrackerStateDto extends AbstractDto {
  data!: Record<string, unknown>;

  constructor(entity: AbstractEntity & { data: Record<string, unknown> }) {
    super(entity);
    this.data = entity.data;
  }
}
