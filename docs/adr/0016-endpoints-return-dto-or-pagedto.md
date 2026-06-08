# ADR-0016: API endpoints return a `Dto` or `PageDto<Dto>`

- **Status**: Accepted
- **Date**: 2026-06-08
- **Deciders**: Backend team

## Context and Problem Statement

Controller methods are the API's wire contract. When an endpoint returns a bare
array (`Dto[]`), an inline object literal (`{ processed: boolean }`), a raw
interface, or a primitive, the response shape is not a first-class, named,
Swagger-described, validated type. That causes:

- Swagger/OpenAPI can't name or document the response, so generated clients get
  anonymous/`any` shapes.
- No single place to evolve the contract; adding a field (e.g. paging metadata,
  a top-level flag) to a bare array is a breaking, ad-hoc change.
- Inconsistency: some endpoints return envelopes, others raw arrays/objects.

## Decision Outcome

**Every endpoint that returns a body MUST return a `Dto` or `PageDto<Dto>`.**

- A `*Dto` (extends `AbstractDto`/`BaseDto`, built via `.create()`/`.toDto()`
  per ADR-0008) — for a single object.
- `PageDto<SomeDto>` — for paginated collections.
- A **collection that is not a `Dto[]` on the wire**: wrap it in a `Dto`
  envelope with a typed array field (e.g. `RecentMemoryPointsDto { items: RecentMemoryPointDto[] }`).
  **Never return a bare `Dto[]`** — wrapping leaves room to add top-level fields
  later without breaking clients.

**Forbidden** as endpoint return types: bare arrays (`T[]`), inline object
literals (`{ a: boolean }`), raw interfaces, primitives.

### Internal data shapes vs wire DTOs

This rule governs the **controller/endpoint** boundary only. Internal layers
(CQRS query/command handlers, service helpers) may — and should — return plain
typed **interfaces** (`IMediaItem`, `IUserStats`, …) so a data-owning module
does not depend on a presentation DTO it doesn't own (ADR-0004 ownership). The
controller/service maps the interface to the `Dto` at the edge.

### Exemptions

- **`void` / `204 No Content`** — write endpoints (DELETE, some PATCH/POST) that
  return no body.
- **Framework/infra endpoints** — the Terminus health check
  (`HealthCheckResult`) and similar library-typed responses.

### Compliance at adoption

- `GET /admin/dashboard/recent-points` returned `RecentMemoryPointDto[]` →
  now `RecentMemoryPointsDto { items: [...] }`.
- Internal `POST /internal/ai-generation/process` returned
  `{ processed: boolean }` → `ProcessGenerationResultDto`.
- D-ID webhook returned `{ received: boolean }` → `DidWebhookAckDto`.

### Positive Consequences

- Swagger names and documents every response; generated clients are typed.
- Response shapes are evolvable (add a field to the envelope, not a breaking
  array→object migration).
- Uniform contract; pairs with `awesome-nest/unique-endpoint-dtos` (each
  endpoint slot gets its own DTO).

### Negative Consequences

- Single-list endpoints carry a one-field envelope (`{ items }`) instead of a
  raw array — a small ceremony cost the frontend must unwrap.

## Enforcement

Convention enforced in review today. It composes with the existing
`awesome-nest/unique-endpoint-dtos` rule (ADR-0014); a dedicated lint rule
(`endpoint-returns-dto`) in `@m-one-dev/awesome-nest-eslint` is the intended
follow-up for static enforcement.

## Links

- Related: [ADR-0008](./0008-abstract-entity-usedto-mapping.md) (DTO construction),
  [ADR-0004](./0004-module-interfaces-in-dedicated-folder.md) (interfaces / module ownership),
  [ADR-0014](./0014-awesome-nest-custom-lint-rules.md) (lint-enforced conventions).
