import { BaseDto } from '../../../common/dto/base.dto.ts';
import {
  ClassField,
  StringField,
} from '../../../decorators/field.decorators.ts';
import { UploadHeaderDto } from './upload-header.dto.ts';

export class UploadTargetDto extends BaseDto {
  /** Short-lived signed URL the client PUTs the file bytes to. */
  @StringField()
  uploadUrl!: string;

  /** GCS object path to send back to the API once the upload finishes. */
  @StringField()
  objectPath!: string;

  /**
   * Headers bound into the signed URL. The client MUST send each one verbatim
   * on the PUT (the values are not inferable client-side).
   */
  @ClassField(() => UploadHeaderDto, { each: true, isArray: true })
  requiredHeaders!: UploadHeaderDto[];
}
