import { BaseDto } from '../../../common/dto/base.dto.ts';
import { StringField } from '../../../decorators/field.decorators.ts';

/** Payload Cloud Tasks delivers to the internal processing endpoint. */
export class ProcessGenerationTaskDto extends BaseDto {
  @StringField()
  readonly talkId!: string;
}
