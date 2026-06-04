# ADR 0003: Re-host expiring external provider assets to GCS

- **Status:** Accepted
- **Date:** 2026-06-03
- **Deciders:** Backend lead, backend team

## Context

D-ID returns generated media (talks/clips) as a pre-signed S3 URL that
**expires in 24 hours** (`X-Amz-Expires=86400`, verified against the live API).
If that URL were stored directly on a memory-point asset, every generated video
would 404 a day after creation.

The same pattern applies to any external provider that hands back short-lived,
signed asset URLs.

## Decision

**When an external provider returns an expiring asset URL, download the asset
and re-host it in our GCS bucket, then store the stable
`storage.googleapis.com` URL as the asset's reference.** Provider URLs are
treated as transient handles, never as the persisted reference.

Failure policy (chosen: **fail-loud**, option B):

- Re-hosting happens during reconcile (`applyDoneResult`).
- The asset is marked `READY` **only** after a successful re-host.
- If re-hosting fails (transient network / GCS error), the asset stays
  `PROCESSING` and the error is logged; a later webhook or manual `refresh`
  retries. An asset is **never** marked `READY` pointing at an expiring URL.

`uploadFromUrl` enforces a download timeout and a max size, and fails (rather
than writing a `.bin`) when the content-type cannot be mapped to an extension.

### Rejected alternative (option A)

On re-host failure, fall back to storing the expiring provider URL and mark
`READY`. Rejected: the asset works for ~24h then silently dies, and nothing
distinguishes a stable URL from a soon-to-rot one.

## Consequences

- **Positive:** asset URLs are permanent and self-hosted; no silent expiry; clear
  retry path; protected against oversized / untyped downloads.
- **Negative:** extra storage + egress for the re-hosted copy; an asset can sit
  in `PROCESSING` longer if GCS is unavailable (recovered on retry).

## References

- `AiAssetService.applyDoneResult` / `GcsStorageService.uploadFromUrl`.
- PR #14 review — provider-URL fallback removed in favour of fail-loud.
