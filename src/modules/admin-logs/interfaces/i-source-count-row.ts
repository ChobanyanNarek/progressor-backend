import type { LogSource } from '../../../constants/log-source.ts';

/** One row of the grouped `source -> count` aggregate (raw query projection). */
export interface ISourceCountRow {
  source: LogSource;
  count: string;
}
