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
