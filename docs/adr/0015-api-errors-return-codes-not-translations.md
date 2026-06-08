# ADR-0015: API errors return stable codes, not server-side translations

- **Status**: Accepted
- **Date**: 2026-06-08
- **Deciders**: Backend team

## Context and Problem Statement

API error responses must communicate *what went wrong* to the frontend. Two
models exist: the backend resolves the error to a localized human sentence
(server-side i18n), or the backend returns a stable machine-readable **code**
and the client renders the localized copy.

The repo ships `nestjs-i18n` with `src/i18n/en_US` and `src/i18n/ru_RU`
message files, which invites adding a translated string for every new error.
In practice the global exception path does **not** translate exception messages
— `throw new SomeException('error.someThing')` returns the raw key in the
`message` field — so clients already receive codes for most errors. Adding
per-error translations on the backend is therefore wasted effort that also puts
product copy and locale ownership in the wrong layer.

## Decision Drivers

- Single source of truth for user-facing copy (the frontend already owns all
  other UI text).
- Locales the client supports (and their wording, tone, pluralization) should
  not require a backend deploy.
- Avoid drift between `en_US`/`ru_RU` message files and the actual codes thrown.
- Keep the error contract stable and testable (assert on a code, not prose).

## Considered Options

1. **Backend returns a stable error code; frontend owns localization.**
2. **Backend returns fully localized messages** (resolve every `error.*` key via
   `nestjs-i18n` in the exception filter, maintain `en_US`/`ru_RU` per error).
3. **Hybrid** — code plus a backend-rendered default message.

## Decision Outcome

Chosen option: **Option 1**. API errors carry a **stable code** in `message`
(e.g. `error.invalidCredentials`, `error.cannotRemoveLastAdmin`, and validation
codes `error.fields.{constraint}`). The backend does **not** translate error
messages and does **not** gain a per-error `en_US`/`ru_RU` entry. The frontend
maps codes to localized, user-facing copy.

Rules:

- New exceptions pass a stable `error.*` **code** to `super(...)`, in
  `camelCase` after the `error.` prefix, grouped by dot when useful
  (`error.unique.email`). The code is the contract.
- **Do not** add backend translation strings for error codes. The
  `src/i18n/**/error.json` files are intentionally emptied (`{}`) — error codes
  do not need a backend entry to function, and none should be re-added.
- Every code (and notable HTTP status) is documented in
  [`docs/error-codes.md`](../error-codes.md), updated in the same PR that adds or
  changes a code.
- `nestjs-i18n` remains **only** for dynamic *content* translation (DTO fields
  marked with the `@Translate` decorators), not for error messages.

### Scope / non-goals

This ADR governs **error** responses. It does not remove `nestjs-i18n` (still
used for translatable content fields). Migrating the few legacy literal-message
exceptions (e.g. `UserExistsException` → `error.userExists`) is desirable but
out of scope here; match on HTTP status until migrated.

### Positive Consequences

- Localization lives entirely on the client; new locales/wording ship without a
  backend deploy.
- Error contract is stable and easy to assert in tests.
- No `en_US`/`ru_RU` ↔ code drift for errors; less per-feature ceremony.

### Negative Consequences

- A raw code surfaced in a non-localized client looks unfriendly; clients must
  maintain a code→copy map and a generic fallback.
- `docs/error-codes.md` must be kept current as the shared contract.

## Pros and Cons of the Options

### Option 1: Stable code, frontend localizes (chosen)

- Good: correct ownership of copy; stable contract; no translation drift.
- Bad: clients must map codes; an unmapped code needs a sensible fallback.

### Option 2: Backend-localized messages

- Good: a client could display `message` verbatim.
- Bad: product copy and locale set live in the backend; every error needs N
  translations; couples wording changes to backend deploys; contradicts how the
  rest of the UI is localized. Rejected.

### Option 3: Hybrid (code + default message)

- Good: verbatim fallback plus a code to switch on.
- Bad: two sources of truth for copy; the backend default still drifts and still
  encodes product wording. Rejected.

## Links

- Code reference: [`docs/error-codes.md`](../error-codes.md)
- Code: `src/exceptions/`, `src/modules/*/exceptions/`,
  `src/filters/bad-request.filter.ts` (validation → `error.fields.*`),
  `src/filters/constraint-errors.ts`.
- Related: [ADR-0012](./0012-custom-field-decorator-dto-validation.md)
  (DTO validation decorators that emit `error.fields.*`),
  [ADR-0013](./0013-enum-and-constant-value-casing.md) (i18n locale codes).
