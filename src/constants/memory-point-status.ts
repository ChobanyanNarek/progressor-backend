export enum MemoryPointStatus {
  PENDING = 'PENDING',
  ADMIN_REVIEWING = 'ADMIN_REVIEWING',
  GENERATING = 'GENERATING',
  AI_REVIEWING = 'AI_REVIEWING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

/**
 * Statuses in which an admin may edit a memory point's medias/texts. Editing is
 * only allowed before (re)generation: while it awaits review (`ADMIN_REVIEWING`)
 * or after a rejection (`REJECTED`). It is blocked mid-flight (`GENERATING`),
 * once published (`APPROVED`), while a draft is still the creator's
 * (`PENDING`), or during AI review (`AI_REVIEWING`).
 */
export const ADMIN_EDITABLE_STATUSES: readonly MemoryPointStatus[] = [
  MemoryPointStatus.ADMIN_REVIEWING,
  MemoryPointStatus.REJECTED,
];

/**
 * Statuses that count as a *live* point for duplicate-proximity ("dedup")
 * checks. A new or repositioned point only collides with these. `PENDING` (an
 * uncommitted creator draft that no one edits and that ages out via cleanup)
 * and `REJECTED` (dead) do not occupy the map, so they never block a point at
 * the same coordinates.
 */
export const DEDUP_LIVE_STATUSES: readonly MemoryPointStatus[] = [
  MemoryPointStatus.ADMIN_REVIEWING,
  MemoryPointStatus.GENERATING,
  MemoryPointStatus.AI_REVIEWING,
  MemoryPointStatus.APPROVED,
];
