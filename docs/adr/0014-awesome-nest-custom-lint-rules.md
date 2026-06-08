# ADR-0014: Architectural conventions enforced as `@m-one-dev/awesome-nest-eslint` rules

- **Status**: Accepted
- **Date**: 2026-06-06
- **Deciders**: Backend team

## Context and Problem Statement

Many of this service's architectural conventions are documented only in ADRs and
the style guides (entity↔DTO mapping in [ADR-0008](./0008-abstract-entity-usedto-mapping.md),
UUID id-field naming in [ADR-0010](./0010-uuid-v4-primary-keys.md), field-decorator
DTO validation in [ADR-0012](./0012-custom-field-decorator-dto-validation.md)).
Documentation drifts: a reviewer must notice a `new UserDto()`, a `findOneBy(...)`,
or a missing `@UseDto` by eye, and those checks are easy to miss across modules.
How do we make conventions that are *statically checkable* non-bypassable rather
than relying on prose and review attention?

The project already imports a **custom company ESLint plugin**,
`@m-one-dev/awesome-nest-eslint` (imported as `awesomeNest` in
`eslint.config.mjs:5`, enabled via `awesomeNest.configs.recommended` at
`eslint.config.mjs:30`). Its rules *encode* these conventions but were
undocumented in the ADRs/docs.

## Decision Drivers

- Conventions that can be machine-checked should not depend on reviewer memory.
- Consistency across feature modules (same DTO/entity/query patterns everywhere).
- A clear, executable failure mode in CI and pre-commit, not just a comment.
- The plugin already exists and ships an opinionated `recommended` config.

## Considered Options

1. **Custom ESLint plugin** (`@m-one-dev/awesome-nest-eslint`) — encode each
   convention as a typed rule, enforced in CI + pre-commit.
2. **Docs-only** — keep conventions in ADRs/style guides and rely on review.
3. **Generic ESLint / Biome rules** — express conventions with off-the-shelf
   rules (`no-restricted-syntax`, naming-convention, etc.).

## Decision Outcome

Chosen option: **Option 1** — architectural conventions that can be statically
enforced are encoded as custom `@m-one-dev/awesome-nest-eslint` rules and
enforced in CI (and pre-commit), rather than relying on review and docs alone.
This makes the conventions executable and non-bypassable: a violating PR fails
lint instead of depending on a reviewer spotting it. Each rule maps to an
architectural decision recorded elsewhere; this ADR is the index that ties the
two together.

The plugin is enabled through its `recommended` flat config
(`eslint.config.mjs:30`), which sets the levels below. The DTO/entity rules are
scoped to the relevant files; `no-dto-direct-instantiation` ignores test files
and `libs/common-module/src/services/abstract-client.service.ts`.

### Rule → convention map

| Rule | Level | Enforces | Related ADR / topic |
|------|-------|----------|---------------------|
| `no-dto-direct-instantiation` | error (excl. tests) | DTOs are built via `SomeDto.create({...})` (input DTOs) or `entity.toDto()` / `entity.toDtos()` (entity-backed); bans `new SomeDto(...)` and `plainToInstance(SomeDto, ...)`, which bypass validation and the `@UseDto` contract. `new` inside the DTO's own static `create` is exempt. Auto-fixes `new X({...})` → `X.create({...})` and 2-arg `plainToInstance` → `.create(...)`. | [ADR-0008](./0008-abstract-entity-usedto-mapping.md), [ADR-0012](./0012-custom-field-decorator-dto-validation.md) |
| `dto-must-extend-abstract-or-base` | error (`**/*.dto.ts`, `**/dto/**`) | Any class whose name ends in `Dto` must transitively extend `AbstractDto` or `BaseDto`. Allowlisted bases: `AbstractDto`, `BaseDto`, `TranslatableDto`, `AbstractTranslationDto`. | [ADR-0008](./0008-abstract-entity-usedto-mapping.md) |
| `require-use-dto-decorator` | error (`**/*.entity.ts`, `**/entities/**`) | Concrete classes that transitively extend `AbstractEntity` (or `AbstractTranslationEntity`) must carry a `@UseDto(...)` decorator, so `entity.toDto()` resolves at runtime instead of throwing. Auto-fixes by inserting `@UseDto(<Derived>Dto)`. | [ADR-0008](./0008-abstract-entity-usedto-mapping.md) |
| `unique-endpoint-dtos` | error | Each DTO class may appear in at most one NestJS endpoint slot (request body, query, or response) across the project — one DTO per endpoint slot keeps the Swagger schema and request/response contracts unambiguous. | API/Swagger contracts ([ADR-0008](./0008-abstract-entity-usedto-mapping.md), `docs/api-documentation.md`) |
| `no-typeorm-finder-methods` | error | Bans TypeORM `Repository`/`EntityManager`/`DataSource`/`TreeRepository`/`MongoRepository` finder methods (`find`, `findBy`, `findOne`, `findOneBy`, `count`, `exist`, `sum`, `findOneOrFail`, …) in favour of `createQueryBuilder(...)` — query-builder discipline for explicit, reviewable queries. | Query-builder discipline (`docs/code-style-and-patterns.md`) |
| `uuid-field-naming` | error | Field-like declarations typed as the `Uuid` brand must end with `Id`; arrays of `Uuid` must end with `Ids`. An optional reverse direction (off by default) flags `*Id`/`*Ids` names whose type is not `Uuid`/`Uuid[]`. | [ADR-0010](./0010-uuid-v4-primary-keys.md), [ADR-0012](./0012-custom-field-decorator-dto-validation.md) |
| `payload-type-suffix` | error | `@Payload()` parameters on NATS controllers and the data argument of `AbstractClientService` `send`/`emit` calls must use a type whose name ends with an allowed payload suffix (default: `PayloadDto`, `PageOptionsDto`, `CursorPageOptionsDto`). | [ADR-0005](./0005-external-provider-integration-pattern.md), microservice messaging contracts |
| `no-unused-injectable` | error | `@Injectable()` classes must actually be injected somewhere; flags providers that are only registered in `@Module()` decorators (or nowhere) and never consumed — dead providers. | Dead-code hygiene (`docs/architecture.md`) |
| `prefer-promise-all` | warn | Flags independent sequential `await`s that could be combined with `Promise.all` for better performance. | Performance hygiene |

### Positive Consequences

- Conventions become executable and non-bypassable — violations fail lint in CI
  and pre-commit instead of depending on a reviewer noticing.
- Two of the most error-prone rules (`no-dto-direct-instantiation`,
  `require-use-dto-decorator`) ship auto-fixers, so `pnpm lint:fix` migrates code
  to the convention automatically.
- The plugin is the single source of truth for the "shape" of a module; new
  contributors get fast, specific feedback.

### Negative Consequences

- Framework value objects must adopt the `.create()` factory to satisfy
  `no-dto-direct-instantiation` — e.g. `PageDto` / `PageMetaDto` (a parallel
  change is bringing those primitives into compliance) — rather than being
  constructed with `new`.
- Maintaining a custom ESLint plugin has cost: the rules use the typed-linting
  parser services and must keep pace with TypeScript / `@typescript-eslint`
  upgrades.
- `eslint-disable` of these rules is **discouraged**; the right fix is almost
  always to comply (use the factory / query builder / `@UseDto`), not to suppress.

## Pros and Cons of the Options

### Option 1: Custom ESLint plugin (chosen)

- Good: conventions are machine-enforced, scoped per file type, auto-fixable
  where it matters, and tied to the existing typed-linting setup.
- Good: each rule encodes a specific ADR/topic, so the convention and its
  rationale stay linked.
- Bad: a custom plugin is extra surface area to maintain and version.

### Option 2: Docs-only

- Good: zero tooling cost; conventions live next to their rationale.
- Bad: drifts immediately — relies entirely on reviewer attention; a `new XDto()`
  or `findOneBy(...)` slips through unless someone notices.

### Option 3: Generic ESLint / Biome rules

- Good: no custom plugin to maintain.
- Bad: rules like "DTO must transitively extend `AbstractDto`" or
  "`@Injectable()` must be injected somewhere" need type information and
  cross-file analysis that `no-restricted-syntax` / naming rules cannot express;
  the result would be fragile string matching, not real enforcement.

## Links

- Project guides: [`docs/linting.md`](../linting.md) (custom rules section),
  [`docs/code-style-and-patterns.md`](../code-style-and-patterns.md),
  [`CLAUDE.md`](../../CLAUDE.md)
- Config: `eslint.config.mjs:5,30` (`awesomeNest.configs.recommended`)
- Plugin: `@m-one-dev/awesome-nest-eslint` (rules in `dist/rules/`, levels in
  `dist/configs/recommended.js`)
- Related ADRs: [ADR-0005](./0005-external-provider-integration-pattern.md),
  [ADR-0008](./0008-abstract-entity-usedto-mapping.md),
  [ADR-0010](./0010-uuid-v4-primary-keys.md),
  [ADR-0012](./0012-custom-field-decorator-dto-validation.md)
