# ADR-0011: JWT RS256 authentication + `@Auth` composite RBAC decorator

- **Status**: Accepted
- **Date**: 2026-06-06
- **Deciders**: Backend team

## Context and Problem Statement

The API needs stateless authentication plus role-based authorization on routes.
Each protected endpoint must verify a token, resolve the user, enforce roles,
and advertise its auth requirement in Swagger. Wiring all of that per route is
repetitive and error-prone. How do we authenticate requests and apply RBAC
consistently with minimal per-route boilerplate?

## Decision Drivers

- Stateless auth (no server session store)
- Asymmetric signing so verifiers need only the public key
- One declarative way to protect a route and declare its roles
- Swagger reflects the auth requirement automatically

## Considered Options

1. **Passport JWT with RS256** + a single `@Auth(roles, { public })` composite decorator
2. **HS256 (shared secret) JWT** with per-route guard wiring
3. **Session-based auth** (server-side session store + cookies)

## Decision Outcome

Chosen option: **Option 1** — JWT verified with an **RSA public key using
RS256**, fronted by a single composite `@Auth` decorator — because asymmetric
signing keeps the signing key isolated from verifiers and one decorator collapses
all the per-route auth/RBAC/Swagger wiring into a declarative call.

Mechanics:

- Tokens are **signed** with the RSA private key and **verified** with the public
  key, algorithm pinned to `RS256` on both sides (`auth.module.ts`:
  `signOptions.algorithm: 'RS256'`, `verifyOptions.algorithms: ['RS256']`).
  `JwtStrategy` configures Passport with `secretOrKey: configService.authConfig.publicKey`
  and extracts the bearer token from the `Authorization` header; it rejects any
  token whose `type` is not `ACCESS_TOKEN` and re-loads the user via
  `UserService`.
- Keys come from config (`JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY`) per
  [ADR-0002](./0002-explicit-environment-configuration.md).
- `@Auth(roles: RoleType[] = [], { public }?)` composes, via `applyDecorators`:
  `Roles(roles)` (sets metadata), `UseGuards(AuthGuard({ public }), RolesGuard)`,
  `ApiBearerAuth()`, `UseInterceptors(AuthUserInterceptor)`,
  `ApiUnauthorizedResponse(...)`, and `PublicRoute(public)`.
- `AuthGuard` adds the `public` Passport strategy when `{ public: true }`, so a
  route can be optionally-authenticated. `RolesGuard` allows the request when no
  roles are required, otherwise checks `roles.includes(user.role)`.

### Positive Consequences

- One decorator protects a route, sets roles, wires the user interceptor, and
  documents auth in Swagger.
- RS256 means only the private key signs; verifiers hold only the public key.
- Stateless — no session store to scale or invalidate.

### Negative Consequences

- RSA keys must be provisioned and rotated (private key kept secret).
- Stateless JWTs cannot be revoked before expiry without extra machinery
  (denylist / short TTL + refresh).
- `RolesGuard` returns `true` when no roles are specified — protection then
  depends entirely on `AuthGuard`; an empty `@Auth()` authenticates but does not
  restrict by role (intended, but a footgun if misread).

## Pros and Cons of the Options

### Option 1: RS256 JWT + `@Auth` decorator (chosen)

- Good: asymmetric keys; stateless; one declarative decorator; Swagger-aware.
- Bad: key provisioning/rotation; revocation needs extra design.

### Option 2: HS256 JWT

- Good: simplest key handling (one shared secret).
- Bad: every verifier holds the signing secret; weaker key isolation; still
  needs the same per-route wiring unless similarly wrapped.

### Option 3: Session-based auth

- Good: trivially revocable (drop the session).
- Bad: requires a shared session store; not stateless; heavier for an API
  consumed by mobile/web clients. Rejected.

## Links

- Project guide: [`docs/architecture.md`](../architecture.md) (Authentication & Authorization)
- Code: `src/modules/auth/jwt.strategy.ts:17-21`,
  `src/modules/auth/auth.module.ts:21,25` (RS256),
  `src/decorators/http.decorators.ts:23-37` (`@Auth`),
  `src/guards/auth.guard.ts`, `src/guards/roles.guard.ts`.
- Related: [ADR-0002](./0002-explicit-environment-configuration.md),
  [ADR-0012](./0012-custom-field-decorator-dto-validation.md)
