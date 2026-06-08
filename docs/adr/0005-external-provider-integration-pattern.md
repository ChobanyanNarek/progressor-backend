# ADR-0005: External AI/media provider integration pattern

- **Status**: Accepted
- **Date**: 2026-06-03
- **Deciders**: Backend team

## Context and Problem Statement

The D-ID integration is the first of likely several external generation
providers. Their work is asynchronous (submit → provider processes → result),
credential-bearing, and webhook-driven. How do we integrate such providers
repeatably so future ones follow the same rules instead of leaking provider
concerns across the app?

## Decision Drivers

- Provider credentials must stay server-side and never be logged
- Generation state must be tracked even when a provider call fails
- Webhooks must not be trusted blindly, and must not trigger retry storms
- Future providers should follow one consistent shape

## Considered Options

1. **Thin-client + server-side + async state machine + GET-verified webhook + GCS re-host** (the composite pattern below)
2. **Direct client-to-provider calls** (mobile/web call the provider, store the result)
3. **Synchronous server-side call** (block the request until the provider returns)

## Decision Outcome

Chosen option: **Option 1** — the composite pattern below — because it keeps
credentials and authoritative state server-side, models long-running generation
as a persisted, trackable state machine, and reconciles via verified webhooks
without retry storms. External provider integrations follow this pattern:

1. **Thin client service** (e.g. `DidService`) owns only HTTP translation:
   build the provider request, send credentials, return the raw response. No
   product/state logic. Provider credentials are read from config
   ([ADR-0002](./0002-explicit-environment-configuration.md)) and never logged.
2. **Server-side only.** Mobile/web clients never call the provider directly;
   all calls go through the Central API so credentials stay server-side and
   state stays consistent.
3. **Async + state machine.** Generation is modelled as a persisted entity with
   an explicit status (`QUEUED → PROCESSING → READY | FAILED`, plus
   `DEPRECATED`/`ARCHIVED`). The record is persisted before the provider call so
   a failure is always trackable.
4. **Webhook reconciliation, GET-verified.** Provider callbacks hit a public,
   unguarded-by-JWT route authenticated by an unguessable secret compared in
   constant time. The webhook body is treated as a notification only — the
   authoritative state is re-fetched from the provider by id before acting.
5. **Idempotent, no retry storms.** Webhook handlers swallow reconcile errors
   and return 200 so the provider does not retry-loop (which would re-download
   and orphan assets); missed updates are recovered via a manual refresh
   endpoint. (A queue-based poller is deferred — see "MVP scope".)
6. **Re-host expiring assets** to GCS per
   [ADR-0003](./0003-rehost-expiring-provider-assets-to-gcs.md).

### Positive Consequences

- Consistent, secure, testable provider integrations.
- Credentials and state stay server-side; no provider becomes the source of
  truth.

### Negative Consequences

- More moving parts than a direct call.
- Webhook secret must be configured and rotated.
- Without a queue, recovery of a missed webhook relies on manual/triggered
  refresh.

### MVP scope / deferred

Redis + BullMQ background poller, automatic retry/backoff, and admin
preview/relink were intentionally deferred for the pilot; reconciliation is
webhook + manual-refresh only.

## Pros and Cons of the Options

### Option 1: Composite pattern (chosen)

- Good: credentials/state stay server-side; generation is trackable; webhooks
  verified and non-storming.
- Bad: most moving parts; requires a rotated webhook secret and manual-refresh
  recovery until a queue is added.

### Option 2: Direct client-to-provider

- Good: least server work; no webhook plumbing.
- Bad: leaks provider credentials to clients; state becomes inconsistent and the
  provider becomes the source of truth. Rejected.

### Option 3: Synchronous server-side call

- Good: simplest server flow; no webhook.
- Bad: ties up a request for the full generation time; no resilience to provider
  slowness/failure. Rejected for long-running generation.

## Links

- Project guide: [`docs/architecture.md`](../architecture.md), [`CLAUDE.md`](../../CLAUDE.md)
- Code: `src/modules/ai-asset/` (controller webhook route, `DidService`,
  `AiAssetService`).
- Evidence: PR #14.
- Related: [ADR-0002](./0002-explicit-environment-configuration.md),
  [ADR-0003](./0003-rehost-expiring-provider-assets-to-gcs.md),
  [ADR-0011](./0011-jwt-rs256-auth-and-auth-decorator.md)
