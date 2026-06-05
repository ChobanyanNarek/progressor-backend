import { StringField } from '../../../decorators/field.decorators.ts';

/** Payload Cloud Tasks delivers to the internal processing endpoint. */
export class ProcessGenerationTaskDto {
  @StringField()
  readonly talkId!: string;
}
