import type { LogLevel } from '../../../constants/log-level.ts';
import type { LogSource } from '../../../constants/log-source.ts';

/**
 * Input contract for {@link AdminLogsService.record}. The writer is
 * fire-and-forget: callers across modules emit a structured diagnostic entry
 * without awaiting persistence (ADR-0004 — `I`-prefixed, dedicated folder).
 */
export interface IAdminLogInput {
  level: LogLevel;
  source: LogSource;
  message: string;
  /** Optional correlation to a memory point (PRD A5/A11 point filter). */
  memoryPointId?: Uuid | null;
  /** Free-form structured payload persisted to the `jsonb` context column. */
  context?: Record<string, unknown>;
  /** Defaults to `new Date()` in `record()` when omitted. */
  timestamp?: Date;
}
