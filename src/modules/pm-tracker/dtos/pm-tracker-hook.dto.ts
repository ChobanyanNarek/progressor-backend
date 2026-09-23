import { AbstractDto } from '../../../common/dto/abstract.dto.ts';

// Deliberately exposes nothing: the token is only ever returned inside a webhook path.
export class PmTrackerHookDto extends AbstractDto {}
