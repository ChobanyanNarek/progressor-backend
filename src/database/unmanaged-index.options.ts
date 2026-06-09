import type { IndexOptions } from 'typeorm';

/**
 * Declares an `@Index` that exists in the database but is **not** managed by
 * TypeORM's schema diff. Use for raw / expression indexes that entity metadata
 * cannot express — e.g. the `pg_trgm` GIN `gin_trgm_ops` search indexes created
 * in `1780942602928-add-performance-indexes`. Declaring them here (with
 * `synchronize: false`) stops `migration:generate` from trying to DROP them as
 * spurious drift, while keeping the index documented on the entity.
 *
 * The runtime `@Index` decorator reads `synchronize` even though it is absent
 * from the public `IndexOptions` type, so we intersect it in explicitly.
 */
export const UNMANAGED_INDEX: IndexOptions & { synchronize: false } = {
  synchronize: false,
};
