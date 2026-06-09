# ADR-0001: Database migrations must be generated, not hand-written

- **Status**: Accepted
- **Date**: 2026-06-03
- **Deciders**: Backend team

## Context and Problem Statement

TypeORM derives the canonical schema (table/column definitions and, crucially,
constraint and index names) from the entity classes. When a migration is written
by hand, its DDL — especially constraint/index names like `PK_ai_assets_id` —
does not match the names TypeORM would generate
(`PK_4f5d53b76a87e4db76b8c009307`). How do we keep entities, migrations, and the
live database from drifting apart?

On the next `pnpm migration:generate`, TypeORM compares its expected schema
against the live database. Any difference (mismatched index/constraint names,
column types, defaults, ordering) is treated as a pending change, so the new
migration contains `DROP CONSTRAINT` / `DROP INDEX` / `ALTER` statements that
tear down and recreate objects that are already correct. This is **schema
drift**: each subsequent migration tries to "fix" the previous hand-written one,
producing destructive, noisy diffs and risking data loss. This was hit during
the D-ID `ai_assets` work: a hand-written migration used custom constraint
names, and the next generated migration would have attempted to drop the
existing schema.

## Decision Drivers

- Entities, migrations, and the database must stay in sync (no drift)
- Migrations must not destructively drop/recreate already-correct objects
- `migration:generate` should be idempotent (empty when nothing changed)
- Output must match the repo's ESM + strict-lint style

## Considered Options

1. **Generate all migrations from entity diffs** (`pnpm migration:generate`); hand-written DDL only for what TypeORM cannot express
2. **Hand-write migrations** with explicit, human-readable constraint names
3. **TypeORM `synchronize: true`** (auto-sync schema, no migration files)

## Decision Outcome

Chosen option: **Option 1** — all schema migrations are produced with
`pnpm migration:generate` from entity changes — because only generated DDL uses
the exact constraint/index names TypeORM expects, which keeps the drift check
idempotent and prevents destructive regenerations. Hand-writing migration DDL is
not allowed **except** for operations TypeORM cannot express (data backfills,
custom SQL, concurrent index creation), which must be added to an
otherwise-generated file and called out in review.

Workflow:

1. Change the entity.
2. Ensure the local DB reflects the schema *before* the change (run existing
   migrations; do not pre-create the new table).
3. `pnpm migration:generate src/database/migrations/<Name>`.
4. Apply the required post-generation cleanup (below) — content/names unchanged.
5. `pnpm migration:run`, then re-run `pnpm migration:generate` as a **drift
   check**: it must report *"No changes in database schema were found"*. If it
   emits a migration, the schema and entities are out of sync — fix before
   merging.

### Required post-generation cleanup

Generated migration files are **exempt from ESLint and Biome** — they are
ignored in `eslint.config.mjs` and `biome.json`, so code-style rules (line
length, formatting, indentation) **must not** touch generated SQL. The raw
`migration:generate` output is committed essentially as-is, with exactly **one
mandatory** change:

- Convert the import to a **type-only import**:
  `import type { MigrationInterface, QueryRunner } from 'typeorm'`. This is not
  cosmetic — with `verbatimModuleSyntax` + ESM + `transpileOnly`, a value import
  of these type-only exports throws
  `SyntaxError: does not provide an export named 'MigrationInterface'` at
  `migration:run`. (A post-generate codemod could automate even this.)

By convention also rename the file to kebab-case
(`<timestamp>-kebab-name.ts`; the class name stays PascalCase) to match the
other migrations — consistency only, no longer lint-enforced. Do **not**
reformat SQL, wrap lines, change indentation, rename constraints, or alter DDL.
Migrations are still **type-checked** (`pnpm typecheck`) and executed via
ts-node, which catches a genuinely broken file.

### Positive Consequences

- Entities, migrations, and DB stay in sync; `migration:generate` is idempotent
  (empty when nothing changed).
- No destructive drop/recreate of existing objects; migrations match the repo's
  existing style.
- A clean drift check (*"No changes ... found"*) is the objective acceptance
  signal for any schema PR.

### Negative Consequences

- Generating requires a DB in the correct pre-migration state (run existing
  migrations first; do not pre-create the new table).
- Every generated file needs the one mandatory `import type` change above
  (migrations are otherwise lint-exempt and committed verbatim).

## Pros and Cons of the Options

### Option 1: Generated migrations (chosen)

- Good: constraint/index names match TypeORM's expectations exactly; drift check
  is idempotent.
- Good: version-controlled, reviewable, reversible files.
- Bad: requires correct pre-migration DB state and post-generation lint cleanup.

### Option 2: Hand-written migrations

- Good: human-readable constraint names; full control over ordering.
- Bad: names never match TypeORM's, so every subsequent generate proposes a
  destructive drop/recreate — the exact drift that motivated this ADR.

### Option 3: `synchronize: true`

- Good: zero migration ceremony in development.
- Bad: no review, no rollback, unsafe for production; silent destructive schema
  changes. Categorically rejected.

## Notes

- **All indexes are TypeORM-managed via entity `@Index` metadata.** Raw
  expression indexes that entity metadata cannot express (e.g. `pg_trgm` GIN
  `gin_trgm_ops` search indexes) are **not** maintained — an earlier
  `synchronize: false` "unmanaged index" escape hatch was removed in favour of a
  fully generated schema. If such an index is needed again, prefer a managed
  alternative; only fall back to a reviewed raw-SQL migration as a deliberate,
  documented exception. Custom-named constraints/FKs are still pinned on the
  entity (`@Index('UQ_…')`, `@JoinColumn({ foreignKeyConstraintName })`) so the
  entity matches the live DB and the diff stays clean.

## Links

- Project guide: [`CLAUDE.md`](../../CLAUDE.md) (Database migrations section)
- Code: `src/database/migrations/`
- Evidence: PR #14 (D-ID `ai_assets`) — original hand-written migration replaced
  with a generated one after this was raised in review.
- Related: [ADR-0006](./0006-tests-required-for-every-feature.md)
