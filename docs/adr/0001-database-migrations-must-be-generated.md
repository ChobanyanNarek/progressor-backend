# ADR 0001: Database migrations must be generated, not hand-written

- **Status:** Accepted
- **Date:** 2026-06-03
- **Deciders:** Backend lead, backend team

## Context

TypeORM derives the canonical schema (table/column definitions and, crucially,
constraint and index names) from the entity classes. When a migration is written
by hand, its DDL — especially constraint/index names like
`PK_ai_assets_id` — does not match the names TypeORM would generate
(`PK_4f5d53b76a87e4db76b8c009307`).

On the next `pnpm migration:generate`, TypeORM compares its expected schema
against the live database. Any difference (mismatched index/constraint names,
column types, defaults, ordering) is treated as a pending change, so the new
migration contains `DROP CONSTRAINT` / `DROP INDEX` / `ALTER` statements that
tear down and recreate objects that are already correct. This is **schema
drift**: each subsequent migration tries to "fix" the previous hand-written one,
producing destructive, noisy diffs and risking data loss.

This was hit during the D-ID `ai_assets` work: a hand-written migration used
custom constraint names, and the lead flagged that the next generated migration
would attempt to drop the existing schema.

## Decision

**All schema migrations must be produced with `pnpm migration:generate` from
entity changes. Hand-writing migration DDL is not allowed** except for
operations TypeORM cannot express (data backfills, custom SQL, concurrent index
creation), which must be added to an otherwise-generated file and called out in
review.

Workflow:

1. Change the entity.
2. Ensure the local DB reflects the schema *before* the change (run existing
   migrations; do not pre-create the new table).
3. `pnpm migration:generate src/database/migrations/<Name>`.
4. Apply the required post-generation cleanup (see below) — content/names
   unchanged.
5. `pnpm migration:run`, then re-run `pnpm migration:generate` as a **drift
   check**: it must report *"No changes in database schema were found"*. If it
   emits a migration, the schema and entities are out of sync — fix before
   merging.

### Required post-generation cleanup

TypeORM's raw output is not lint-clean in this repo (ESM + strict lint). After
generating, apply only formatting/syntax fixes — never rename constraints or
alter DDL:

- Use a type-only import: `import type { MigrationInterface, QueryRunner }`
  (`verbatimModuleSyntax` is on; a value import crashes at runtime).
- Rename the file to kebab-case (`unicorn/filename-case`), e.g.
  `1780490447264-add-ai-assets.ts`. The class name stays PascalCase.
- Wrap long SQL strings across lines to satisfy `max-len` (150).

## Consequences

- **Positive:** entities, migrations, and DB stay in sync; `migration:generate`
  is idempotent (empty when nothing changed); no destructive drop/recreate of
  existing objects; migrations match the repo's existing style.
- **Negative:** generating requires a DB in the correct pre-migration state, and
  every generated file needs the small lint cleanup above.
- **Verification:** a clean drift check (`No changes ... found`) is the
  acceptance signal for any schema PR.

## References

- PR #14 (D-ID `ai_assets`) — original hand-written migration replaced with a
  generated one after this was raised in review.
