import { BaseDto } from '../../../common/dto/base.dto.ts';
import {
  StringField,
  StringFieldOptional,
} from '../../../decorators/field.decorators.ts';

/**
 * An error raised in a user's browser by the pm-tracker web app. Sizes are capped so a
 * runaway client cannot write unbounded rows into the admin log.
 */
export class ReportClientErrorDto extends BaseDto {
  @StringField({ maxLength: 500 })
  readonly message!: string;

  // Stack traces are multi-line: keep the newlines the default trim would strip.
  @StringFieldOptional({ maxLength: 8000, trimNewLines: false })
  readonly stack?: string;

  // Where it happened: the page URL at the time of the error.
  @StringFieldOptional({ maxLength: 2000 })
  readonly url?: string;

  // What raised it: 'error' | 'unhandledrejection' | 'render' | 'save'.
  @StringFieldOptional({ maxLength: 40 })
  readonly kind?: string;

  // The frontend build that raised it, so an error can be tied to a deploy.
  @StringFieldOptional({ maxLength: 80 })
  readonly release?: string;
}
