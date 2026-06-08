# 📚 Backend Service Documentation Hub

Welcome to the backend-service documentation! This hub is the navigation entry
point for the NestJS 11 + TypeScript + PostgreSQL/TypeORM service. It maps every
doc to its purpose so you can find what you need fast.

> Looking for the rendered docs site? Run `pnpm docs:dev` (VitePress, port 7070).
> The VitePress home page is [`index.md`](index.md); this `README.md` is the
> GitHub / editor-facing navigation hub.

## 🎯 Quick Start

**New to the project? Read these three, in order:**

1. **[🚀 Getting Started](getting-started.md)** — prerequisites, install, env, first run
2. **[🏗️ Architecture](architecture.md)** — modules, CQRS, TypeORM, auth, design patterns
3. **[🔄 Development](development.md)** — daily workflow, migrations, Docker, debugging

## 📋 Documentation Index

| Doc | Purpose | When to read |
|---|---|---|
| [getting-started.md](getting-started.md) | Prerequisites, install, env setup, first run | First day on the project |
| [development.md](development.md) | Daily dev workflow, DB ops, Docker, debugging | Setting up / daily work |
| [architecture.md](architecture.md) | Module structure, CQRS, TypeORM, auth, patterns | Understanding the codebase |
| [code-generation.md](code-generation.md) | `pnpm generate` schematics (module/service/dto/…) | Scaffolding new code |
| [code-style-and-patterns.md](code-style-and-patterns.md) | Project coding conventions & patterns | Before writing code |
| [nestjs-code-style-guide.md](nestjs-code-style-guide.md) | NestJS-specific style guide | Deep style questions |
| [naming-cheatsheet.md](naming-cheatsheet.md) | Naming conventions cheat sheet | Naming files/classes/vars |
| [linting.md](linting.md) | Biome + ESLint setup and rules | Lint errors / config |
| [testing.md](testing.md) | Unit + e2e testing strategy and patterns | Writing tests (ADR-0006) |
| [api-documentation.md](api-documentation.md) | Swagger / OpenAPI conventions (`@ApiOperation`) | Adding/altering endpoints |
| [openapi-mcp.md](openapi-mcp.md) | OpenAPI MCP integration | Wiring API into MCP tooling |
| [deployment.md](deployment.md) | Build & deployment guidance | Shipping to an environment |
| [adr/README.md](adr/README.md) | Architecture Decision Records index | Before changing binding decisions |

## 🧭 Architecture Decision Records

Binding technical decisions live in [`adr/`](adr/README.md). Read the relevant
ADR **before** changing migrations, configuration, external integrations, or
shared structure. When a change establishes or alters a significant decision,
add or supersede an ADR in the same PR.

| ADR | Decision |
|---|---|
| [0001](adr/0001-database-migrations-must-be-generated.md) | Migrations are **generated**, never hand-written; clean drift check required |
| [0002](adr/0002-explicit-environment-configuration.md) | Config read **explicitly** from env; no code-side defaults |
| [0003](adr/0003-rehost-expiring-provider-assets-to-gcs.md) | Re-host **expiring** provider asset URLs to GCS; `READY` only after re-host |
| [0004](adr/0004-module-interfaces-in-dedicated-folder.md) | Interfaces in a dedicated `interfaces/` folder, `I`-prefixed |
| [0005](adr/0005-external-provider-integration-pattern.md) | External providers: thin-client + server-side + async state machine + verified webhook |
| [0006](adr/0006-tests-required-for-every-feature.md) | Every feature/behavioural change ships with tests in the same PR |
| [0007](adr/0007-cqrs-mandatory-for-feature-modules.md) | Feature logic goes through **CQRS** command/query handlers |
| [0008](adr/0008-abstract-entity-usedto-mapping.md) | Entities extend `AbstractEntity`; DTO mapping via `@UseDto` / `toDto()` |
| [0009](adr/0009-global-prototype-augmentation-polyfill.md) | Boilerplate polyfills & prototype augmentation are centralized |
| [0010](adr/0010-uuid-v4-primary-keys.md) | Primary keys are **UUID v4** via `@PrimaryGeneratedColumn('uuid')` |
| [0011](adr/0011-jwt-rs256-auth-and-auth-decorator.md) | Auth uses **JWT with RS256** (RSA key pair) |
| [0012](adr/0012-custom-field-decorator-dto-validation.md) | DTO validation via custom **field decorators**, not raw class-validator |
| [0013](adr/0013-enum-and-constant-value-casing.md) | Enum **values** follow the project's casing convention |

## 🎯 Developer Journey

### 👶 New Developer

1. **[Getting Started](getting-started.md)** — set up your environment
2. **[Architecture](architecture.md)** — learn the module/CQRS structure
3. **[Code Style & Patterns](code-style-and-patterns.md)** — how we write code
4. **[Development](development.md)** — run the app, generate code, write a migration

### 🔄 Daily Development

1. **[Development](development.md)** — common commands and DB workflow
2. **[Code Generation](code-generation.md)** — scaffold modules/services/DTOs
3. **[Testing](testing.md)** — write unit + e2e tests (required, ADR-0006)
4. **[API Documentation](api-documentation.md)** — document every endpoint
5. **[Linting](linting.md)** — fix Biome/ESLint issues

### 🚀 Advanced Topics

1. **[Architecture](architecture.md)** — deep dive into CQRS, TypeORM, auth
2. **[ADRs](adr/README.md)** — the *why* behind binding decisions
3. **[OpenAPI MCP](openapi-mcp.md)** — expose the API to MCP tooling
4. **[Deployment](deployment.md)** — production build & deploy

## 🔍 Quick Reference

### Common Commands

```bash
# Development
pnpm start:dev                                   # Vite hot-reload dev server (preferred)
pnpm nest:start:dev                              # NestJS CLI watch mode

# Testing
pnpm test                                        # Jest unit tests
pnpm test:e2e                                    # E2E tests (needs Docker postgres)

# Database migrations (generated, never hand-written — ADR-0001)
pnpm migration:generate src/database/migrations/<Name>   # generate from entity diff
pnpm migration:run                               # apply pending migrations

# Code quality
pnpm lint:fix                                    # ESLint autofix

# Docs site
pnpm docs:dev                                    # VitePress docs on port 7070
```

### Key Files

- **Entry point**: `src/main.ts` (global filters / interceptors / pipes)
- **TypeORM DataSource**: `ormconfig.ts`
- **Env template**: `.env.example`
- **Lint/format config**: `biome.json`, `eslint.config.mjs`

### Important Directories

- **Feature modules**: `src/modules/`
- **Shared services**: `src/shared/services/`
- **Migrations**: `src/database/migrations/`
- **E2E tests**: `test/`

### Swagger / API Docs

Available at **`/documentation`** when `ENABLE_DOCUMENTATION=true`.

## 🆘 Need Help?

- **Setup problems** → [Getting Started](getting-started.md)
- **Daily workflow / migrations** → [Development](development.md)
- **Architecture questions** → [Architecture](architecture.md) + [ADRs](adr/README.md)
- **Lint / format errors** → [Linting](linting.md)
- **Testing** → [Testing](testing.md)
- **API / Swagger** → [API Documentation](api-documentation.md)

## 📚 External Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [Biome Documentation](https://biomejs.dev/)
- [VitePress Documentation](https://vitepress.dev/)

---

_This documentation is maintained by the development team. For updates or
improvements, please open a pull request._
