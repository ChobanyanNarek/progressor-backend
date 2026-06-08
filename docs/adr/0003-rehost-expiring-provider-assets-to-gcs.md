# ADR-0003: Re-host expiring external provider assets to GCS

- **Status**: Accepted
- **Date**: 2026-06-03
- **Deciders**: Backend team

## Context and Problem Statement

D-ID returns generated media (talks/clips) as a pre-signed S3 URL that
**expires in 24 hours** (`X-Amz-Expires=86400`, verified against the live API).
If that URL were stored directly on a memory-point asset, every generated video
would 404 a day after creation. How do we persist a stable, long-lived
reference to provider-generated media? The same pattern applies to any external
provider that hands back short-lived, signed asset URLs.

## Decision Drivers

- Asset references must remain valid indefinitely (no silent 24h expiry)
- A stored URL must be distinguishable from a soon-to-rot provider URL
- Re-host failures must be recoverable, never leave a broken "ready" asset

## Considered Options

1. **Re-host to GCS, fail-loud** — download the asset, store the stable GCS URL; mark `READY` only after a successful re-host
2. **Re-host to GCS, fall back to provider URL** — on re-host failure, store the expiring provider URL and mark `READY` anyway
3. **Store the provider URL directly** — no re-hosting at all

## Decision Outcome

Chosen option: **Option 1** (fail-loud) — when an external provider returns an
expiring asset URL, download the asset and re-host it in our GCS bucket, then
store the stable `storage.googleapis.com` URL as the asset's reference — because
provider URLs are transient handles and an asset must never be marked `READY`
while pointing at a URL that will rot. Provider URLs are never the persisted
reference.

Failure policy (chosen: **fail-loud**):

- Re-hosting happens during reconcile (`applyDoneResult`).
- The asset is marked `READY` **only** after a successful re-host.
- If re-hosting fails (transient network / GCS error), the asset stays
  `PROCESSING` and the error is logged; a later webhook or manual `refresh`
  retries. An asset is **never** marked `READY` pointing at an expiring URL.

`uploadFromUrl` enforces a download timeout and a max size, and fails (rather
than writing a `.bin`) when the content-type cannot be mapped to an extension.

### Positive Consequences

- Asset URLs are permanent and self-hosted; no silent expiry.
- Clear retry path; an asset is never `READY` with a rotting URL.
- Protected against oversized / untyped downloads.

### Negative Consequences

- Extra storage + egress for the re-hosted copy.
- An asset can sit in `PROCESSING` longer if GCS is unavailable (recovered on
  retry).

## Pros and Cons of the Options

### Option 1: Re-host, fail-loud (chosen)

- Good: references never expire; failure leaves an honestly-`PROCESSING` asset.
- Bad: extra storage/egress; longer `PROCESSING` window during GCS outages.

### Option 2: Re-host, fall back to provider URL

- Good: the asset always reaches `READY`.
- Bad: the asset works for ~24h then silently dies, and nothing distinguishes a
  stable URL from a soon-to-rot one. Rejected.

### Option 3: Store provider URL directly

- Good: zero extra storage; simplest.
- Bad: every generated asset 404s after 24h. Categorically rejected.

## Links

- Project guide: [`CLAUDE.md`](../../CLAUDE.md)
- Code: `AiAssetService.applyDoneResult`, `GcsStorageService.uploadFromUrl`
- Evidence: PR #14 review — provider-URL fallback removed in favour of
  fail-loud.
- Related: [ADR-0005](./0005-external-provider-integration-pattern.md)
