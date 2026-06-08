import { BaseDto } from '../../../common/dto/base.dto.ts';
import { StringField } from '../../../decorators/field.decorators.ts';

export class UploadTargetDto extends BaseDto {
  /** Short-lived signed URL the client PUTs the file bytes to. */
  @StringField()
  uploadUrl!: string;

  /** GCS object path to send back to the API once the upload finishes. */
  @StringField()
  objectPath!: string;
}
