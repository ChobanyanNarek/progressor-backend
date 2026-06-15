import { BaseDto } from '../../../common/dto/base.dto.ts';
import { PublicationState } from '../../../constants/publication-state.ts';
import { EnumField } from '../../../decorators/field.decorators.ts';

export class UpdatePublicationStateDto extends BaseDto {
  @EnumField(() => PublicationState)
  readonly publicationState!: PublicationState;
}
