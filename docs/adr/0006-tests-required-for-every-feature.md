# ADR 0006: Every feature ships with automated tests

- **Status:** Accepted
- **Date:** 2026-06-03
- **Deciders:** Backend lead, backend team

## Context

The D-ID integration merged with zero test coverage. A later deep review found
seven defects, including one (`F-A`) that made the entire webhook reconciliation
path return `422` for every real callback — a bug a single endpoint test would
have caught. Behaviour-critical logic (async state machines, webhook handling,
auth/secret checks, re-host invariants) is exactly the code most likely to
regress silently and least safe to ship untested.

## Decision

**Every feature or behavioural change ships with automated tests in the same PR.**

- **Unit tests** are mandatory for service/handler logic: state transitions,
  branching, guards, validation, and error paths. Colocate as `*.spec.ts` next
  to the source.
- **Endpoint/HTTP tests** are required when a change adds or alters an HTTP route,
  a guard/pipe interaction, or a webhook contract. At minimum, assert the success
  status and one rejection path.
  - Prefer a **focused HTTP integration `*.spec.ts`** that boots only the
    controller behind the real global pipe with the service mocked (see
    `ai-asset.webhook.spec.ts`). Full-`AppModule` `test/*.e2e-spec.ts` currently
    cannot bootstrap under jest (the app reads `import.meta.dirname`, undefined
    in ts-jest) **and** would `dropSchema` the dev DB (`postgresConfig` sets
    `dropSchema: isTest`) — only run those against a disposable test database.
- A bug fix ships with a **regression test** that fails before the fix and passes
  after.
- New `*.spec.ts` files outside the build `tsconfig` must be registered in
  `eslint.config.mjs` `allowDefaultProject` so they are type-linted (globs with
  `**` are rejected by typed-linting — list files explicitly).
- Test files are exempt from the strict `no-unsafe-*` and
  `no-confusing-void-expression` rules (scoped override in `eslint.config.mjs`)
  so loosely-typed mocks don't fight the linter.

Pure refactors with no behavioural change, and config/docs-only changes, are
exempt — but must not reduce existing coverage.

## Consequences

- **Positive:** behavioural regressions are caught in CI, not production;
  webhook/state-machine logic stays correct under change; PRs document intended
  behaviour as executable specs.
- **Negative:** slightly more work per PR; the explicit `allowDefaultProject`
  list grows by one entry per new spec file.

## References

- `src/modules/ai-asset/ai-asset.service.spec.ts`,
  `ai-asset.controller.spec.ts` (added with the D-ID review fixes).
- Deep-review finding `F-A` (webhook payload rejected by the global
  `ValidationPipe`).
