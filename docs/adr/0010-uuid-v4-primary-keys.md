# ADR-0010: UUID v4 primary keys (v7 recorded as a future option)

- **Status**: Accepted
- **Date**: 2026-06-06
- **Deciders**: Backend team

## Context and Problem Statement

All entities inherit their primary key from `AbstractEntity`, which uses
`@PrimaryGeneratedColumn('uuid')` — i.e. database-side **UUID v4** (random). The
project documentation (`docs/architecture.md` and `CLAUDE.md`) previously
described the keys as **UUID v7** with chronological ordering and embedded
timestamps. That was documentation drift: the code never generated v7. What is
the actual primary-key strategy, and what do we do about the drift?

## Decision Drivers

- Documentation must match the code (resolve the v7-vs-v4 drift honestly)
- Globally-unique, non-enumerable identifiers
- Low implementation/operational cost
- Keep a future performance option (v7) on record without overclaiming it today

## Considered Options

1. **UUID v4 via `@PrimaryGeneratedColumn('uuid')`** (current reality)
2. **UUID v7** generated at the application layer (chronological, timestamp-embedded)
3. **Auto-increment integer / bigint** primary keys

## Decision Outcome

Chosen option: **Option 1** — **UUID v4 is the current, accepted primary-key
strategy**, generated database-side by `@PrimaryGeneratedColumn('uuid')` on
`AbstractEntity`. This ADR also **corrects the documentation drift**: the docs
that claimed UUID v7 were wrong; v4 is what the code does and what we are
adopting.

Consequences of v4 being random:

- Primary keys carry **no ordering or timestamp** information. Do **not** sort or
  reason about creation time from the `id`. Use the dedicated `createdAt`
  (`@CreateDateColumn`) column instead (e.g. `order: { createdAt: 'ASC' }`).
- `UUIDParam`/`ParseUUIDPipe` validate version **4**, and `ApiUUIDParam`
  documents params as "UUID v4".

### Future option (not adopted)

**UUID v7** — generated at the application layer (e.g. a `@BeforeInsert()` hook)
— would encode a Unix-millisecond timestamp in its high bits, giving
chronological ordering (sequential B-tree inserts, fewer random page splits at
scale) and a timestamp recoverable directly from the id. This is recorded as a
**documented future option only**; it is not implemented. Adopting it would be a
new ADR superseding this one, and would require changing the validated UUID
version and the key-generation strategy.

### Positive Consequences

- Docs now match code (drift resolved).
- v4 is zero-effort, DB-native, globally unique and non-enumerable.
- A clear, on-record upgrade path to v7 if/when ordering performance matters.

### Negative Consequences

- Random keys give no chronological locality; large tables can see index page
  splits/fragmentation that v7 would avoid.
- A separate `createdAt` column is required for time-ordering (no free timestamp
  in the id).

## Pros and Cons of the Options

### Option 1: UUID v4 (chosen)

- Good: DB-native, zero app code, globally unique, non-enumerable; matches
  current reality.
- Bad: random → no ordering, potential index fragmentation at scale.

### Option 2: UUID v7

- Good: chronological ordering, sequential index inserts, embedded timestamp.
- Bad: requires app-layer generation and a version change; not yet implemented —
  kept as a future option.

### Option 3: Auto-increment integer

- Good: smallest keys, naturally ordered, fast indexes.
- Bad: enumerable (information leak), painful across distributed/sharded inserts,
  and a large migration away from the existing UUID scheme. Rejected.

## Links

- Project guide: [`docs/architecture.md`](../architecture.md) (UUID v4 Primary Keys)
- Code: `src/common/abstract.entity.ts:26-27`,
  `src/decorators/http.decorators.ts:43,53`.
- Related: [ADR-0008](./0008-abstract-entity-usedto-mapping.md)
