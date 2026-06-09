# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Decision Records (read first)

Binding technical decisions live in [`docs/adr/`](docs/adr/README.md). **Before
changing migrations, configuration, external integrations, or shared structure,
read the relevant ADR and follow it. When a change establishes or alters a
significant decision, add or supersede an ADR in the same PR.** Current ADRs:

- [ADR-0001](docs/adr/0001-database-migrations-must-be-generated.md) — DB migrations must be **generated** (`pnpm migration:generate src/database/migrations/<Name>`), never hand-written; a clean drift check is required.
- [ADR-0002](docs/adr/0002-explicit-environment-configuration.md) — Config is read **explicitly** from env; no code-side defaults (defaults belong in `.env.example`).
- [ADR-0003](docs/adr/0003-rehost-expiring-provider-assets-to-gcs.md) — Re-host **expiring** external provider asset URLs to GCS; mark `READY` only after a successful re-host.
- [ADR-0004](docs/adr/0004-module-interfaces-in-dedicated-folder.md) — Interfaces live in a dedicated `interfaces/` folder (`I`-prefixed), not in service files.
- [ADR-0005](docs/adr/0005-external-provider-integration-pattern.md) — External AI/media providers follow the thin-client + server-side + async-state-machine + GET-verified-webhook pattern.
- [ADR-0006](docs/adr/0006-tests-required-for-every-feature.md) — Every feature/behavioural change ships with automated tests in the same PR (unit for logic, e2e for routes/webhooks; bug fixes get a regression test).
- [ADR-0007](docs/adr/0007-cqrs-mandatory-for-feature-modules.md) — Feature write/read logic goes through **CQRS** command/query handlers, not fat services.
- [ADR-0008](docs/adr/0008-abstract-entity-usedto-mapping.md) — Entities extend `AbstractEntity` and map to DTOs via the `@UseDto` decorator / `toDto()`.
- [ADR-0009](docs/adr/0009-global-prototype-augmentation-polyfill.md) — Boilerplate polyfills and prototype augmentation are centralized (e.g. `Array.prototype.toDtos`, global types).
- [ADR-0010](docs/adr/0010-uuid-v4-primary-keys.md) — Primary keys are **UUID v4** via `@PrimaryGeneratedColumn('uuid')` (DB-generated); v7 noted as a future option.
- [ADR-0011](docs/adr/0011-jwt-rs256-auth-and-auth-decorator.md) — Auth uses **JWT with RS256** (RSA key pair); tokens signed/verified with `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY`.
- [ADR-0012](docs/adr/0012-custom-field-decorator-dto-validation.md) — DTO validation uses the custom **field decorators** (`@StringField`, `@EmailField`, …), not raw `class-validator`.
- [ADR-0013](docs/adr/0013-enum-and-constant-value-casing.md) — Enum **values** follow the project's casing convention (consistent string casing across enums).
- [ADR-0014](docs/adr/0014-awesome-nest-custom-lint-rules.md) — Statically-checkable conventions are enforced as custom **`@m-one-dev/awesome-nest-eslint`** rules in CI (DTOs via `.create()`/`.toDto()`, `@UseDto` required, no TypeORM finder methods, `Uuid`-typed fields end in `Id`, …), not docs alone.
- [ADR-0015](docs/adr/0015-api-errors-return-codes-not-translations.md) — API errors return a **stable code** (e.g. `error.invalidCredentials`), never a server-localized message; the frontend owns localization. Don't add backend error translations — `src/i18n/**/error.json` stays empty. Document every code in [`docs/error-codes.md`](docs/error-codes.md).
- [ADR-0016](docs/adr/0016-endpoints-return-dto-or-pagedto.md) — Every endpoint that returns a body returns a **`Dto`** or **`PageDto<Dto>`** — never a bare array, inline object, interface, or primitive (wrap lists in a `Dto` envelope, e.g. `{ items: SomeDto[] }`). Structured returns are `Dto`s **everywhere** — CQRS query/command handlers and services that produce a shape return the `Dto` (built via `.create()`/`.toDto()`), owned by the **producing** module; the controller passes it through. Plain interfaces are only for non-return internal shapes (query rows, config). Exempt: `void`/204 and framework health checks.

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
Generated migrations are **lint-exempt** (ignored by ESLint + Biome) and
committed verbatim — do **not** reformat or wrap their SQL. The only mandatory
post-generate change is the type-only import
(`import type { MigrationInterface, QueryRunner }`; a value import crashes at
`migration:run`); kebab-case filename is convention only. Confirm a clean drift
check (re-running generate reports "No changes"). See ADR 0001.

## Architecture

- Feature modules under `src/modules/` — each fully encapsulated (CQRS pattern recommended)
- Shared services in `src/shared/`
- Global filters, interceptors, pipes registered in `src/main.ts`
- Swagger available at `/documentation` when `ENABLE_DOCUMENTATION=true`

For detailed architecture: @docs/architecture.md

### Module Anatomy

A request flows top-down through one feature module. Each layer has one job:

```
HTTP request
  → Controller (*.controller.ts)      # route, @ApiOperation, DTO validation, @Auth
    → Service (*.service.ts)          # thin: dispatches via CommandBus / QueryBus
      → Command / Query Handler       # CQRS business logic (ADR-0007)
        → Repository / Entity         # TypeORM persistence (AbstractEntity + @UseDto)
  ← DTO (entity.toDto())              # response mapping (ADR-0008)
```

**Entity ownership — one entity per module:** each entity belongs to exactly one
module. Never import another module's entity directly — go through its service.

### Quick Navigation — where things live

| What | Where |
|---|---|
| Feature modules | `src/modules/*/` |
| CQRS commands / queries | `src/modules/*/commands/`, `src/modules/*/queries/` |
| DTOs | `src/modules/*/dtos/` |
| Entities | `src/modules/*/*.entity.ts` |
| Module interfaces (`I`-prefixed) | `src/modules/*/interfaces/` (ADR-0004) |
| Shared services | `src/shared/services/` |
| Migrations (generated) | `src/database/migrations/` (ADR-0001) |
| Global filters / interceptors / pipes | registered in `src/main.ts` |
| Config (TypeORM DataSource + env) | `ormconfig.ts` + `.env.example` (ADR-0002) |
| E2E tests | `test/` |

### File Boundaries — never hand-edit

These are generated or managed by tooling; do not edit them by hand:

- `src/database/migrations/*` — **generated** via `pnpm migration:generate` (ADR-0001)
- `src/metadata.ts` — generated (Nest CLI / Swagger plugin metadata)
- `pnpm-lock.yaml` — managed by pnpm

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

**Controller endpoints — every endpoint MUST have `@ApiOperation`** (see the
[API documentation guide](docs/api-documentation.md) and Swagger setup). This is
the standard; some legacy endpoints predate it, so when you touch an endpoint
without one, add it:
```ts
@Get(':id')
@ApiOperation({ summary: 'Get user by ID' })
async getUser(...) {}
```

**Type imports — use `import type` for type-only imports** (VerbatimModuleSyntax is enabled):
```ts
import type { UserDto } from './user.dto.ts';
```

**Custom lint rules (enforced by `@m-one-dev/awesome-nest-eslint` — see [ADR-0014](docs/adr/0014-awesome-nest-custom-lint-rules.md)):**
- Build DTOs with `SomeDto.create({...})` (input) or `entity.toDto()` / `entity.toDtos()` (entity-backed) — never `new SomeDto(...)` or `plainToInstance(SomeDto, ...)` (ADR-0008).
- Every `*Dto` class must extend `AbstractDto` / `BaseDto`; every concrete `AbstractEntity` needs `@UseDto(...)`.
- No TypeORM finder methods (`find`, `findOneBy`, `count`, …) — use `createQueryBuilder(...)`.

**TypeScript strictness:** No `any` — use `unknown` when type is uncertain. All strict flags are on.

**General casing:** `PascalCase` classes/types/enums, `camelCase` variables/functions, `kebab-case` file names, `SCREAMING_SNAKE_CASE` env vars.

### Naming Patterns

| Type | Pattern | Example |
|---|---|---|
| Entity | `*.entity.ts` | `user.entity.ts` → `UserEntity` |
| Service | `*.service.ts` | `user.service.ts` → `UserService` |
| Controller | `*.controller.ts` | `user.controller.ts` → `UserController` |
| DTO | `*.dto.ts` | `user.dto.ts` → `UserDto` |
| Command | `*.command.ts` | `create-post.command.ts` → `CreatePostCommand` |
| Command Handler | `*.handler.ts` | `create-post.handler.ts` → `CreatePostHandler` |
| Query | `*.query.ts` | `get-post.query.ts` → `GetPostQuery` |
| Query Handler | `*.handler.ts` | `get-post.handler.ts` → `GetPostHandler` |
| Module | `*.module.ts` | `user.module.ts` → `UserModule` |
| Migration | `<timestamp>-kebab-name.ts` | `1754340825698-add-gifts-table.ts` |
| Interface | `i-*.ts` / `I`-prefixed in `interfaces/` | `i-user-payload.ts` → `IUserPayload` (ADR-0004) |
| Spec / test | `*.spec.ts` | `user.service.spec.ts` |

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
  type-linted.
- Test files are exempt from a small, deliberate set of rules (see the
  test-files block in `eslint.config.mjs`); **every other strict rule stays on**
  (async tests need an `await`, fixtures must be typed, etc.) — fix violations
  rather than disabling. The exemptions are:
  - `@typescript-eslint/no-unsafe-*` (assignment/member-access/call/return/
    argument) — fire on Jest mock plumbing (`jest.Mock` returns `any`, mocks
    injected via `as never`, `mock.calls[i][j]` is `any[][]`) and on asserting
    against the CQRS base `Command`/`Query` type.
  - `awesome-nest/uuid-field-naming` — governs DTO/entity field naming, not test
    fixtures.
  - `sonarjs/assertions-in-tests` — false-positives on supertest's `.expect()`.
  - `sonarjs/no-hardcoded-passwords` — throwaway login fixtures.
- Spec files are type-checked: `tsconfig.json` includes `**/*.spec.ts` (build
  still excludes them via `tsconfig.build.json`). Run `pnpm typecheck` to catch
  spec type errors the build/Jest (swc) skip.

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
