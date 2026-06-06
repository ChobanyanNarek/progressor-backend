# ADR-0002: Configuration is read explicitly from the environment, no code-side defaults

- **Status**: Accepted
- **Date**: 2026-06-03
- **Deciders**: Backend team

## Context and Problem Statement

`ApiConfigService` exposes typed getters (`gcsConfig`, `authConfig`, `didConfig`,
…) that read environment variables via private `getString` / `getNumber` /
`getBoolean` helpers. During the D-ID work some `didConfig` values were given
hard-coded fallback defaults (e.g. `getString('D_ID_BASE_URL',
'https://api.d-id.com')`, `getBoolean('D_ID_USE_WEBHOOK', false)`), and a
`defaultValue` parameter was added to `getBoolean` to support them. Should
configuration carry baked-in defaults, or fail fast when a variable is missing?

This was inconsistent with every other getter in the service, which reads
required values with no fallback, and it hides misconfiguration: a missing or
wrong variable silently resolves to a baked-in value instead of failing.

## Decision Drivers

- Misconfiguration must surface immediately and loudly (fail fast)
- Config behaviour must be consistent across every getter
- A single source of truth for example values (no drift between code and `.env.example`)

## Considered Options

1. **No code-side defaults** — every getter reads with a single key; missing variable throws
2. **Code-side fallback defaults** — getters accept a `defaultValue` argument
3. **Validated config schema** (e.g. Joi/Zod) with defaults declared in the schema

## Decision Outcome

Chosen option: **Option 1** — configuration values are read explicitly from the
environment with no code-side defaults — because a missing variable should fail
fast at boot / first access rather than silently resolving to a value that
drifts from `.env.example`. Defaults belong in `.env.example` (documented
placeholders), not in code.

- Do not add `defaultValue` fallbacks in the config helpers for new config.
- `.env.example` must list every variable the app reads, with a sane example.
- A consequence is that all variables a code path touches must be set in the
  environment (`.env` locally, Secret Manager in deployed envs) or the app fails
  fast at boot / first access — this is intended.

### Positive Consequences

- Misconfiguration surfaces immediately and loudly.
- Config behaviour is consistent across the service.
- No hidden "magic" values drifting from `.env.example`.

### Negative Consequences

- Every consumed variable must be present in the environment, even
  optional-feeling ones.
- `.env.example` must be kept complete and in sync with what the code reads.

## Pros and Cons of the Options

### Option 1: No code-side defaults (chosen)

- Good: fail-fast on misconfiguration; one consistent rule for all getters.
- Good: `.env.example` is the single documented source of example values.
- Bad: every consumed variable must be set, even in local/dev.

### Option 2: Code-side fallback defaults

- Good: fewer required env vars to set locally.
- Bad: hides misconfiguration; values silently drift from `.env.example`;
  inconsistent with existing getters.

### Option 3: Validated config schema

- Good: centralised validation and typed defaults.
- Bad: larger change than warranted; reintroduces in-code defaults (the thing
  we're rejecting); not adopted for now.

## Links

- Project guide: [`CLAUDE.md`](../../CLAUDE.md) (Environment Setup)
- Code: `src/shared/services/api-config.service.ts`, `.env.example`
- Evidence: PR #14 — D-ID `didConfig` defaults removed and the `getBoolean`
  `defaultValue` addition reverted after review.
- Related: [ADR-0005](./0005-external-provider-integration-pattern.md)
