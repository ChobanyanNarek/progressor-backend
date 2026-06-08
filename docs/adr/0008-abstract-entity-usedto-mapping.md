# ADR-0008: Entity↔DTO mapping via `AbstractEntity` + `@UseDto`

- **Status**: Accepted
- **Date**: 2026-06-06
- **Deciders**: Backend team

## Context and Problem Statement

Entities must never leak directly to API responses (they carry relations,
internal columns, and persistence concerns). Every entity therefore needs a
consistent, low-boilerplate way to convert to its response DTO. How do we
standardise entity→DTO conversion across all modules?

## Decision Drivers

- One uniform conversion mechanism for every entity
- Minimal per-entity boilerplate
- A clear failure mode when an entity is missing its DTO mapping
- Plays well with collection/pagination conversion

## Considered Options

1. **`AbstractEntity<DTO, Options>` base + `@UseDto(SomeDto)` decorator** — `toDto()` reads the DTO class from the prototype
2. **Manual mappers** — a hand-written `toDto` per entity (or a mapper class)
3. **A mapping library** (e.g. AutoMapper-style) with profiles

## Decision Outcome

Chosen option: **Option 1** — all entities extend
`AbstractEntity<DTO, Options>` and are annotated `@UseDto(SomeDto)` — because it
gives every entity `toDto()` for free with one decorator and a clear runtime
error when the annotation is missing. The `@UseDto` decorator stores the DTO
class on `ctor.prototype.dtoClass`; `AbstractEntity.toDto()` reads it and
constructs `new dtoClass(this, options)`, throwing a descriptive error if
`@UseDto` was not applied.

Collection conversion is provided by the array/query-builder polyfills
([ADR-0009](./0009-global-prototype-augmentation-polyfill.md)): `toDtos()`
maps an array of entities, and `toPageDto(pageMetaDto)` produces a paginated
`PageDto`.

Rules:

- Every entity extends `AbstractEntity<TheDto, TheOptions>` (Options defaults to
  `never`).
- Every entity is annotated `@UseDto(TheDto)`.
- Convert with `entity.toDto()`, `entities.toDtos()`, or
  `entities.toPageDto(meta)`; do not return raw entities from handlers/controllers.

### Positive Consequences

- One uniform conversion path; near-zero per-entity boilerplate.
- Missing `@UseDto` fails loudly with a descriptive error at `toDto()` time.
- Pagination and collection conversion are one call away.

### Negative Consequences

- The mapping is resolved at runtime via the prototype, not at compile time — a
  wrong/missing decorator is caught at runtime, not by the type checker.
- The `dtoClass` is attached with a typed-`unknown` cast inside the decorator
  (one localised escape hatch).

## Pros and Cons of the Options

### Option 1: `AbstractEntity` + `@UseDto` (chosen)

- Good: uniform, minimal boilerplate, descriptive failure, pagination-friendly.
- Bad: runtime (not compile-time) resolution of the DTO class.

### Option 2: Manual mappers

- Good: fully explicit and type-checked.
- Bad: repetitive boilerplate on every entity; easy to forget/diverge.

### Option 3: Mapping library

- Good: convention-driven; handles nested mapping.
- Bad: heavy dependency and configuration for what `@UseDto` already solves;
  conflicts with the existing convention.

## Links

- Project guide: [`docs/architecture.md`](../architecture.md) (Entity-DTO Mapping)
- Code: `src/common/abstract.entity.ts:22-52`,
  `src/decorators/use-dto.decorator.ts:3-14`,
  `src/modules/memory-points/entities/memory-point.entity.ts:20-25`.
- Related: [ADR-0009](./0009-global-prototype-augmentation-polyfill.md),
  [ADR-0010](./0010-uuid-v4-primary-keys.md)
