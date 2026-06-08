# ADR-0007: CQRS is mandatory for feature modules

- **Status**: Accepted
- **Date**: 2026-06-06
- **Deciders**: Backend team

## Context and Problem Statement

Feature modules grow many operations (create, update, delete, several reads).
Putting all of that logic directly in a service produces a fat class that mixes
write and read concerns and is hard to test in isolation. How should
feature-module business logic be structured so each operation is small,
discoverable, and unit-testable?

## Decision Drivers

- Each operation should be a small, single-responsibility unit
- Reads and writes have different concerns and should be separable
- Handlers should be unit-testable without the controller or HTTP layer
- Consistency across feature modules so any engineer can locate an operation

## Considered Options

1. **CQRS via `@nestjs/cqrs`** — every state change is a `Command` + `@CommandHandler`, every retrieval is a `Query` + `@QueryHandler`; services dispatch via `CommandBus`/`QueryBus`
2. **Fat service** — all logic as methods on the feature service
3. **Per-operation service classes** without the bus abstraction

## Decision Outcome

Chosen option: **Option 1** — CQRS is mandatory for feature modules — because it
forces each operation into its own small, testable handler and keeps a uniform
shape across modules. This is already the established reality: there are
**19 handlers** across the `memory-points`, `memory-point-ai-generation`, and
`user` modules.

Rules:

- Every **state change** is a `*.command.ts` + a `@CommandHandler`-annotated
  `*.handler.ts` implementing `ICommandHandler`.
- Every **retrieval** is a `*.query.ts` + a `@QueryHandler`-annotated
  `*.handler.ts` implementing `IQueryHandler`.
- Controllers/services dispatch via `CommandBus.execute` / `QueryBus.execute`;
  they do not embed the business logic themselves.
- Commands/queries are colocated:
  `commands/<name>/<name>.{command,handler}.ts`,
  `queries/<name>/<name>.{query,handler}.ts`.

### Exception

`auth` and `health-checker` are plain service-based modules (no commands/queries).
Authentication is a thin token/credential flow and the health checker is a
trivial status endpoint — neither benefits from the command/query split.

### Positive Consequences

- Each operation is a small, single-responsibility, independently-testable class.
- Reads and writes are cleanly separated.
- Uniform structure: the handler for any operation is found by its folder name.

### Negative Consequences

- More files per operation (command/query + handler + spec) than a service
  method.
- Indirection: tracing a request goes controller → service → bus → handler.
- Newcomers must learn the command/query/handler layout.

## Pros and Cons of the Options

### Option 1: CQRS via `@nestjs/cqrs` (chosen)

- Good: small testable handlers; read/write separation; uniform layout; already
  in place (19 handlers).
- Bad: file count and bus indirection.

### Option 2: Fat service

- Good: fewer files; no bus indirection.
- Bad: one class accretes all write+read logic; harder to test and review at
  scale.

### Option 3: Per-operation services, no bus

- Good: small classes without the bus ceremony.
- Bad: no uniform dispatch; loses the consistency the bus enforces; reinvents
  what `@nestjs/cqrs` already provides.

## Links

- Project guide: [`docs/architecture.md`](../architecture.md) (CQRS), [`CLAUDE.md`](../../CLAUDE.md)
- Code: `src/modules/memory-points/commands/create-memory-point/create-memory-point.handler.ts`,
  `src/modules/user/commands/create-user/create-user.handler.ts`,
  `src/modules/user/user.service.ts` (dispatch via `commandBus`/`queryBus`).
- Related: [ADR-0008](./0008-abstract-entity-usedto-mapping.md),
  [ADR-0006](./0006-tests-required-for-every-feature.md)
