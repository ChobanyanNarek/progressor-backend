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

### Internal CQRS projections also return a `Dto`

Originally this ADR exempted internal layers (CQRS query/command handlers,
service helpers), allowing them to return plain typed **interfaces**
(`IMediaItem`, `IUserStats`, …). **That exemption is removed.** A structured
return shape is a `Dto` everywhere — at the endpoint *and* in the CQRS
query/command handler and service that produces it. Handlers build the `Dto`
via `.create()`/`.toDto()` and return it; the controller passes it through (or
wraps a list in its envelope `Dto`).

Rationale: one named, validated, Swagger-described shape per concept — no
"is this an internal interface or a wire DTO?" judgement call, no parallel
interface that drifts from the DTO it mirrors, and `BaseDto.create()` validation
runs at the point of construction.

**The producing (data-owning) module owns the `Dto`.** This keeps ADR-0004
intact: a consumer (e.g. `admin-dashboard`, `admin-media`) imports the `Dto`
from the module that owns the data (`memory-points`, `user`); the producer never
imports a consumer's DTO. Cross-module stat/aggregate shapes use nested
breakdown DTOs (`MemoryPointStatusBreakdownDto`, `UserRoleBreakdownDto`) instead
of `Record<Enum, number>`.

> Plain interfaces remain fine for **non-return** internal shapes — query-row
> projections, raw SQL result rows (`IStatusCountRow`), config objects — i.e.
> anything that is not a handler/service *return type*.

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

### Internal projection interfaces → DTOs (exemption removal)

The original "internal layers return interfaces" carve-out was dropped. These
CQRS handler/service return interfaces became DTOs, owned by the producing
module:

- `IMediaItem` → `MediaItemDto` (`memory-points`); `get-media` handler now
  returns `PageDto<MediaItemDto>`, the `admin-media` controller passes it
  through.
- `IRecentMemoryPoint` → `RecentMemoryPointDto` (`memory-points`); the
  `admin-dashboard` envelope `RecentMemoryPointsDto` imports it.
- `IMemoryPointStats` → `MemoryPointStatsDto { total, byStatus:
  MemoryPointStatusBreakdownDto }` (`memory-points`).
- `IUserStats` → `UserStatsDto { total, byRole: UserRoleBreakdownDto }`
  (`user`).

`MemoryPointStatusBreakdownDto` moved from `admin-dashboard` to its owning
`memory-points` module; `DashboardStatsDto` imports it from there.

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
