import type { AbstractEntity } from '../../../common/abstract.entity.ts';
import { AbstractDto } from '../../../common/dto/abstract.dto.ts';

export class PmTrackerStateDto extends AbstractDto {
  data!: Record<string, unknown>;

  constructor(entity: AbstractEntity & { data: Record<string, unknown> }) {
    super(entity);
    this.data = entity.data;
  }
}
