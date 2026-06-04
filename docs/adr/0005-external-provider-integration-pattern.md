# ADR 0005: External AI/media provider integration pattern

- **Status:** Accepted
- **Date:** 2026-06-03
- **Deciders:** Backend lead, backend team

## Context

The D-ID integration is the first of likely several external generation
providers. Their work is asynchronous (submit → provider processes → result),
credential-bearing, and webhook-driven. We want a repeatable shape so future
providers follow the same rules instead of leaking provider concerns across the
app.

## Decision

External provider integrations follow this pattern:

1. **Thin client service** (e.g. `DidService`) owns only HTTP translation:
   build the provider request, send credentials, return the raw response. No
   product/state logic. Provider credentials are read from config (ADR 0002)
   and never logged.
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
6. **Re-host expiring assets** to GCS per ADR 0003.

## Consequences

- **Positive:** consistent, secure, testable provider integrations; credentials
  and state stay server-side; no provider becomes the source of truth.
- **Negative:** more moving parts than a direct call; webhook secret must be
  configured and rotated; without a queue, recovery of a missed webhook relies
  on manual/triggered refresh.

## MVP scope / deferred

Redis + BullMQ background poller, automatic retry/backoff, and admin
preview/relink were intentionally deferred for the pilot; reconciliation is
webhook + manual-refresh only.

## References

- `src/modules/ai-asset/` (controller webhook route, `DidService`,
  `AiAssetService`). PR #14.
