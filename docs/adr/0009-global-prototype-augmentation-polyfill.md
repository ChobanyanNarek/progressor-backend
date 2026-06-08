# ADR-0009: Global prototype augmentation via `boilerplate.polyfill.ts`

- **Status**: Accepted
- **Date**: 2026-06-06
- **Deciders**: Backend team

## Context and Problem Statement

The codebase relies on a handful of ergonomic helpers everywhere: converting an
array of entities to DTOs (`toDtos`/`toPageDto`), pulling a translation by
language (`getByLanguage`), and paginating/searching TypeORM query builders
(`paginate`/`searchByString`). It also wants a branded `Uuid` type globally. How
should these cross-cutting helpers be exposed — and do we accept that they are
implemented by mutating built-in prototypes?

## Decision Drivers

- One call-site idiom for DTO/pagination conversion across all modules
- A branded `Uuid` type available globally without per-file imports
- Fluent pagination/search directly on TypeORM `SelectQueryBuilder`
- Honest acknowledgement of the trade-offs of prototype mutation

## Considered Options

1. **Global prototype augmentation** in `boilerplate.polyfill.ts`, imported first in `main.ts`
2. **Plain utility functions** (e.g. `toDtos(entities)`, `paginate(qb, opts)`)
3. **A base repository / mixin** that exposes pagination and conversion as methods

## Decision Outcome

Chosen option: **Option 1** — `src/boilerplate.polyfill.ts` augments built-in
prototypes and declares global types, and is imported as the very first line of
`src/main.ts` (`import './boilerplate.polyfill';`) so the augmentations exist
before anything else runs. This is an inherited boilerplate convention; we keep
it for consistency rather than partially unwinding it.

What it augments:

- **`Array.prototype`** — `toDtos<Dto>(options?)`, `toPageDto<Dto>(meta, options?)`,
  and `getByLanguage(languageCode)`.
- **TypeORM `SelectQueryBuilder.prototype`** — `paginate(pageOptionsDto, options?)`,
  `searchByString(q, columnNames, options?)`, plus type-tightened
  `leftJoin(AndSelect)` / `innerJoin(AndSelect)` signatures.
- **Global types** — `Uuid` (a branded `string & { _uuidBrand: undefined }`) and
  `Todo`.

### Honest framing

This is an opinionated, surprising-to-newcomers pattern. Mutating
`Array.prototype` and a library's prototype is normally discouraged: it is
global, implicit (methods appear on values with no import), and can in principle
collide with future built-in or library methods. We accept it because it is the
established boilerplate idiom, the single-file blast radius is contained, and the
import-first ordering in `main.ts` makes the augmentation deterministic.

### Positive Consequences

- Uniform, terse call sites: `entities.toPageDto(meta)`,
  `qb.paginate(opts)`.
- `Uuid` branding is available everywhere with no import.
- Pagination/search read fluently on the query builder.

### Negative Consequences

- Surprising to newcomers — methods appear on `Array`/`SelectQueryBuilder` with
  no visible import.
- Potential (if unlikely) name collision with future built-in/library methods.
- Must be imported before any consumer; the `main.ts` first-line import is
  load-bearing and easy to break.
- Requires `declare global` / `declare module 'typeorm'` blocks and a few
  localised lint suppressions.

## Pros and Cons of the Options

### Option 1: Prototype augmentation (chosen)

- Good: terse, uniform call sites; global `Uuid`; matches inherited boilerplate.
- Bad: implicit/global; import-ordering dependency; collision risk.

### Option 2: Plain utility functions

- Good: explicit imports; no prototype mutation; no ordering dependency.
- Bad: noisier call sites; would require touching every existing call site to
  migrate.

### Option 3: Base repository / mixin

- Good: scoped to our own types, no built-in mutation.
- Bad: does not cover `Array`/`getByLanguage`; larger refactor than warranted.

## Links

- Project guide: [`docs/architecture.md`](../architecture.md), [`CLAUDE.md`](../../CLAUDE.md)
- Code: `src/boilerplate.polyfill.ts:14-174` (global types `:14-35`,
  `SelectQueryBuilder` augmentation `:37-98`, implementations `:100-174`),
  `src/main.ts:1`.
- Related: [ADR-0008](./0008-abstract-entity-usedto-mapping.md),
  [ADR-0010](./0010-uuid-v4-primary-keys.md)
