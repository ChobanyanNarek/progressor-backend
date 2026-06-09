import { PageOptionsDto } from '../../../common/dto/page-options.dto.ts';

/**
 * Page-options for the name-search endpoint. Inherits `q`, `order`, `page`,
 * `take` from {@link PageOptionsDto}. `q` stays optional here — an empty term
 * lists the APPROVED set (paginated); the handler treats a missing `q` as a
 * match-all rather than 500-ing. A dedicated alias keeps the search endpoint's
 * request slot distinct from the nearby endpoint (awesome-nest/unique-endpoint-dtos).
 */
export class SearchMemoryPointsPageOptionsDto extends PageOptionsDto {}
