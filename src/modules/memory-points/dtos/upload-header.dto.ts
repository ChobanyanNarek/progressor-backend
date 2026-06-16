import { BaseDto } from '../../../common/dto/base.dto.ts';
import { StringField } from '../../../decorators/field.decorators.ts';

/**
 * A header the client MUST send verbatim on the signed upload PUT. These are
 * bound into the GCS v4 signature, so a missing/altered value is rejected
 * (400 MalformedSecurityHeader / 403 SignatureDoesNotMatch).
 */
export class UploadHeaderDto extends BaseDto {
  /** Header name, e.g. `Content-Type` or `x-goog-content-length-range`. */
  @StringField()
  name!: string;

  /** Exact header value to send. */
  @StringField()
  value!: string;
}
