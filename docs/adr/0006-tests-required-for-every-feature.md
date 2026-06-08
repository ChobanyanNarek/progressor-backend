# ADR-0006: Every feature ships with automated tests

- **Status**: Accepted
- **Date**: 2026-06-03
- **Deciders**: Backend team

## Context and Problem Statement

The D-ID integration merged with zero test coverage. A later deep review found
seven defects, including one (`F-A`) that made the entire webhook reconciliation
path return `422` for every real callback — a bug a single endpoint test would
have caught. Should behaviour-critical logic (async state machines, webhook
handling, auth/secret checks, re-host invariants) be allowed to ship untested?

## Decision Drivers

- Behavioural regressions must be caught in CI, not production
- The riskiest code (state machines, webhooks, guards) is exactly what regresses silently
- PRs should document intended behaviour as executable specs

## Considered Options

1. **Tests mandatory in the same PR** as every feature/behavioural change
2. **Tests optional / best-effort** (encouraged but not required)
3. **Tests in a separate follow-up PR**

## Decision Outcome

Chosen option: **Option 1** — every feature or behavioural change ships with
automated tests in the same PR — because the D-ID incident showed that untested
behaviour-critical logic ships broken, and a same-PR rule is the only one that
keeps coverage from perpetually slipping to "later".

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

### Positive Consequences

- Behavioural regressions are caught in CI, not production.
- Webhook/state-machine logic stays correct under change.
- PRs document intended behaviour as executable specs.

### Negative Consequences

- Slightly more work per PR.
- The explicit `allowDefaultProject` list grows by one entry per new spec file.

## Pros and Cons of the Options

### Option 1: Mandatory, same PR (chosen)

- Good: coverage tracks every change; the riskiest code is always exercised.
- Bad: more work per PR; bookkeeping in `allowDefaultProject`.

### Option 2: Optional / best-effort

- Good: fastest to merge.
- Bad: exactly how the D-ID feature shipped with seven defects. Rejected.

### Option 3: Tests in a follow-up PR

- Good: unblocks the feature PR.
- Bad: follow-ups slip; the feature is unprotected in the window between. Rejected.

## Links

- Project guide: [`CLAUDE.md`](../../CLAUDE.md) (Testing)
- Code: `src/modules/ai-asset/ai-asset.service.spec.ts`,
  `ai-asset.controller.spec.ts` (added with the D-ID review fixes);
  `eslint.config.mjs`.
- Evidence: deep-review finding `F-A` (webhook payload rejected by the global
  `ValidationPipe`).
- Related: [ADR-0007](./0007-cqrs-mandatory-for-feature-modules.md)
