# ADR 0002: Configuration is read explicitly from the environment, no code-side defaults

- **Status:** Accepted
- **Date:** 2026-06-03
- **Deciders:** Backend lead, backend team

## Context

`ApiConfigService` exposes typed getters (`gcsConfig`, `authConfig`, `didConfig`,
…) that read environment variables via private `getString` / `getNumber` /
`getBoolean` helpers. During the D-ID work some `didConfig` values were given
hard-coded fallback defaults (e.g. `getString('D_ID_BASE_URL',
'https://api.d-id.com')`, `getBoolean('D_ID_USE_WEBHOOK', false)`), and a
`defaultValue` parameter was added to `getBoolean` to support them.

This was inconsistent with every other getter in the service, which reads
required values with no fallback, and it hides misconfiguration: a missing or
wrong variable silently resolves to a baked-in value instead of failing.

## Decision

**Configuration values are read explicitly from the environment with no
code-side defaults.** Every config getter calls `getString`/`getNumber`/
`getBoolean` with a single key argument; a missing variable throws at access
time (fail fast). Defaults belong in `.env.example` (documented placeholders),
not in code.

- Do not add `defaultValue` fallbacks in the config helpers for new config.
- `.env.example` must list every variable the app reads, with a sane example.
- A consequence is that all variables a code path touches must be set in the
  environment (`.env` locally, Secret Manager in deployed envs) or the app
  fails fast at boot / first access — this is intended.

## Consequences

- **Positive:** misconfiguration surfaces immediately and loudly; config
  behaviour is consistent across the service; no hidden "magic" values drifting
  from `.env.example`.
- **Negative:** every consumed variable must be present in the environment, even
  optional-feeling ones; `.env.example` must be kept complete.

## References

- PR #14 — D-ID `didConfig` defaults removed and the `getBoolean` `defaultValue`
  addition reverted after review.
