import { PageOptionsDto } from '../../../common/dto/page-options.dto.ts';
import { StringField } from '../../../decorators/field.decorators.ts';

/** Page-options for the name-search endpoint. Inherits `order`, `page`, `take`. */
export class SearchMemoryPointsPageOptionsDto extends PageOptionsDto {
  /**
   * Required search term — at least one character. Matched against
   * memory_point_details.title using case-insensitive substring search (ILIKE).
   *
   * Narrows the inherited optional `q` to required. The `= ''` initializer
   * satisfies `useDefineForClassFields` (avoids TS2612 overwriting the base
   * field with `undefined`); a missing `q` then fails `@StringField` minLength,
   * so the term is effectively mandatory.
   */
  @StringField({ minLength: 1 })
  override readonly q: string = '';
}
