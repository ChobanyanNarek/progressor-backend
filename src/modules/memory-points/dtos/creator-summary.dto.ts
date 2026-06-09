import { BaseDto } from '../../../common/dto/base.dto.ts';
import {
  EmailField,
  StringField,
  StringFieldOptional,
  UUIDField,
} from '../../../decorators/field.decorators.ts';

/**
 * Projection of the creating user's identity, embedded on admin-facing memory
 * point rows. It deliberately extends `BaseDto` (not `AbstractDto`) because it
 * is a nested embed with no own id/timestamps — see ADR-0016: the producing
 * (memory-points) module owns this returned shape.
 */
export class CreatorSummaryDto extends BaseDto {
  @UUIDField()
  id!: Uuid;

  @StringField()
  firstName!: string;

  @StringField()
  lastName!: string;

  @EmailField()
  email!: string;

  @StringFieldOptional({ nullable: true })
  avatar?: string | null;
}
