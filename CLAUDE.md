# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Decision Records (read first)

Binding technical decisions live in [`docs/adr/`](docs/adr/README.md). **Before
changing migrations, configuration, external integrations, or shared structure,
read the relevant ADR and follow it. When a change establishes or alters a
significant decision, add or supersede an ADR in the same PR.** Current ADRs:

- **0001** — DB migrations must be **generated** (`pnpm migration:generate`), never hand-written; a clean drift check is required.
- **0002** — Config is read **explicitly** from env; no code-side defaults (defaults belong in `.env.example`).
- **0003** — Re-host **expiring** external provider asset URLs to GCS; mark `READY` only after a successful re-host.
- **0004** — Interfaces live in a dedicated `interfaces/` folder (`I`-prefixed), not in service files.
- **0005** — External AI/media providers follow the thin-client + server-side + async-state-machine + GET-verified-webhook pattern.
- **0006** — Every feature/behavioural change ships with automated tests in the same PR (unit for logic, e2e for routes/webhooks; bug fixes get a regression test).

## Project Overview

Enterprise-grade NestJS 11 boilerplate — TypeScript, PostgreSQL + TypeORM, JWT auth (RS256), CQRS, i18n, Google Cloud Storage, multi-runtime (Node/Bun/Deno).

## Package Manager

Use **pnpm**. Do not use npm or yarn.

## Key Commands

```bash
pnpm start:dev          # Vite hot-reload dev server (preferred)
pnpm nest:start:dev     # NestJS CLI watch mode
pnpm build:prod         # Production build
pnpm test               # Jest unit tests
pnpm test:e2e           # E2E tests
pnpm test:cov           # Coverage report
pnpm lint               # ESLint
pnpm lint:fix           # ESLint autofix
pnpm generate           # NestJS code generation (awesome-nestjs-schematics)
pnpm g                  # Shorthand for generate
```

**Database migrations** (required for any schema change). Migrations are
**generated, never hand-written** — see ADR 0001.
```bash
# Generate from entity diff (positional path; DB must be at pre-change state).
pnpm migration:generate src/database/migrations/<Name>
pnpm migration:run      # Apply migrations
pnpm migration:revert   # Revert last migration
```
After generating, apply the lint cleanup noted in ADR 0001 (`import type`,
kebab-case filename, wrap long SQL) and confirm a clean drift check
(re-running generate reports "No changes").

## Architecture

- Feature modules under `src/modules/` — each fully encapsulated (CQRS pattern recommended)
- Shared services in `src/shared/`
- Global filters, interceptors, pipes registered in `src/main.ts`
- Swagger available at `/documentation` when `ENABLE_DOCUMENTATION=true`

For detailed architecture: @docs/architecture.md

## Critical Code Rules

**ESM imports — always include `.ts` extensions:**
```ts
// Correct
import { UserService } from './user.service.ts';
// Wrong
import { UserService } from './user.service';
```

**Entity ownership — one entity per module:**
- Each entity belongs to exactly one module
- Never import another module's entity directly; use its service instead

**Controller endpoints — always add `@ApiOperation`:**
```ts
@Get(':id')
@ApiOperation({ summary: 'Get user by ID' })
async getUser(...) {}
```

**Type imports — use `import type` for type-only imports** (VerbatimModuleSyntax is enabled):
```ts
import type { UserDto } from './user.dto.ts';
```

**TypeScript strictness:** No `any` — use `unknown` when type is uncertain. All strict flags are on.

**Naming:** `PascalCase` classes/types/enums, `camelCase` variables/functions, `kebab-case` file names, `SCREAMING_SNAKE_CASE` env vars.

For full style rules: @.cursor/rules/nestjs-clean-typescript-cursor-rules.mdc

## Testing

**Tests are mandatory for every feature/behavioural change — see ADR 0006.**
Unit-test service/handler logic (state transitions, guards, validation, error
paths); add an e2e test when adding/altering a route, pipe/guard interaction, or
webhook; ship a regression test with every bug fix. Pure refactors and
docs/config-only changes are exempt but must not reduce coverage.

- Unit tests: colocated with source as `*.spec.ts`
- E2E tests: `test/` directory
- Run a single test: `pnpm test -- --testNamePattern="test name"`
- E2E tests require running Docker services (`docker-compose up -d postgres`)
- New `*.spec.ts` files must be added to `allowDefaultProject` in
  `eslint.config.mjs` (list explicitly — `**` globs are rejected) so they are
  type-linted; test files are exempt from the strict `no-unsafe-*` rules.

For testing patterns: @.cursor/rules/testing-guidelines.mdc

## Git Conventions

**Branches:** `feature/<name>` or `fix/<name>` → `develop` → `main`

**Commits:** Conventional Commits format:
```
feat(user): add profile image upload
fix(auth): handle expired refresh tokens
chore(deps): upgrade typeorm to 0.3.21
```

Pre-commit hooks (Husky + lint-staged) automatically run Biome + ESLint on staged `.ts` files.

## Environment Setup

Copy `.env.example` to `.env`. Key vars to configure:
- `DB_*` — PostgreSQL connection
- `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` — RSA keys (examples in `.env.example`)
- `CORS_ORIGINS` — comma-separated allowed origins
- `REDIS_URL` — used by Docker services; not yet wired into application code

Docker services: `docker-compose up -d` starts Postgres and pgAdmin (port 8080).

## Formatter

**Biome** is the primary formatter/linter. ESLint runs alongside it.
- Biome config: `biome.json`
- ESLint config: `eslint.config.mjs`
- Pre-commit: lint-staged runs `biome lint --write` then `eslint --fix` on staged files
