# ARCore Cloud Anchor keyless auth token

The mobile app hosts ARCore **Cloud Anchors**. When the client authenticates to
Google's ARCore API with a plain **API key**, Google caps every hosted anchor at
a **24-hour TTL**. Switching the client to **keyless (token) authorization**
raises the ceiling to **365 days**, but keyless auth requires a short-lived,
server-signed OAuth2 JWT minted from a Google Cloud **service-account private
key** — which the mobile client must never hold.

This backend exposes an authenticated endpoint that mints that token on demand.

---

## Endpoint (for the mobile team)

```
GET /ar/anchor-token
Authorization: Bearer <app user's access token>
```

> **Path note:** this service has no `/api/v1` global prefix (routing is
> subdomain-based, e.g. `https://api-dev.evmemory.com`). The full dev URL is
> `https://api-dev.evmemory.com/ar/anchor-token`.

- **Auth:** the same bearer access token the app already uses for every other
  authenticated call (roles `CREATOR` or `ADMIN`). Anonymous callers get `401`.
- **Rate limit:** 10 requests / minute per IP. A client only needs a token about
  once per hour; the backend also caches and reuses a still-valid token, so
  calling more often than that is unnecessary.

**Response `200`:**

```json
{
  "token": "<signed-jwt>",
  "expiresAt": "2026-07-06T12:00:00.000Z"
}
```

- `token` — pass to ARCore's `setAuthToken(...)` before hosting/resolving anchors.
- `expiresAt` — ISO-8601 UTC. **Tokens expire hourly.** Re-fetch when the current
  one is near expiry (or just before a host/resolve if you don't cache it).
- On a signing failure the endpoint returns `500` with body
  `{ "message": "error.arcoreTokenSigningFailed", ... }` (a stable code, not
  display copy — see [error-codes.md](error-codes.md)).

### The JWT it signs

Self-signed (RS256) with the service-account private key. Header
`{ "alg": "RS256", "typ": "JWT", "kid": "<private_key_id>" }`; claims:

| Claim | Value |
|---|---|
| `iss` | service-account email |
| `sub` | service-account email (same as `iss`) |
| `iat` | now (epoch seconds) |
| `exp` | `iat + 3600` (ARCore rejects longer-lived tokens) |
| `aud` | `https://arcore.googleapis.com/` (exact, trailing slash) |

---

## Google Cloud setup (run once per environment)

Use the **same Google Cloud project that owns the existing ARCore API key** so
anchors already hosted stay resolvable. For **dev** that is
`elektit-site-1668585486699` (the "ElektIT site" project behind
`api-dev.evmemory.com`).

```bash
PROJECT=elektit-site-1668585486699   # dev; use the prod project for prod

# 1. Confirm the ARCore API is enabled in this project.
gcloud services enable arcore.googleapis.com --project="$PROJECT"

# 2. Create the signer service account.
gcloud iam service-accounts create arcore-anchor-signer \
  --display-name="ARCore Cloud Anchor token signer" --project="$PROJECT"
SA="arcore-anchor-signer@$PROJECT.iam.gserviceaccount.com"

# 3. Grant the Service Account Token Creator role.
#    NOTE: the endpoint signs the JWT LOCALLY with the downloaded private key and
#    needs NO IAM role for that. This role is only required for the optional
#    server-side TTL-extension follow-up (Cloud Anchor Management API, which needs
#    an OAuth2 access token). Granting it now keeps that follow-up unblocked.
gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:$SA" \
  --role="roles/iam.serviceAccountTokenCreator"

# 4. Create a JSON key for the service account.
gcloud iam service-accounts keys create arcore-signer-key.json \
  --iam-account="$SA" --project="$PROJECT"
```

### Wire the key into secret storage (never commit it)

The JSON key holds `client_email`, `private_key`, and `private_key_id`. Map them
to the three env vars this service reads (see [`.env.example`](../.env.example)):

| JSON field | Env var |
|---|---|
| `client_email` | `ARCORE_SIGNER_CLIENT_EMAIL` |
| `private_key` | `ARCORE_SIGNER_PRIVATE_KEY` |
| `private_key_id` | `ARCORE_SIGNER_PRIVATE_KEY_ID` |

**Local dev:** put them in `.env`. The `private_key` must be a single line with
literal `\n` (exactly like `JWT_PRIVATE_KEY`); `ApiConfigService` un-escapes them.

**Deployed (dev/prod):** runtime config is a JSON blob in **Secret Manager**
(`DEV_APP_SECRETS`), merged into `process.env` at boot by `src/load-secrets.ts` —
`--set-env-vars` in the deploy workflow carries only bootstrap vars, so the three
`ARCORE_SIGNER_*` keys must be added to that blob or the endpoint 500s at request
time (ADR-0002: no code-side defaults, a missing var throws). To add them:

```bash
gcloud secrets versions access latest --secret=DEV_APP_SECRETS --project="$PROJECT" \
  > secrets.json
# edit secrets.json → add ARCORE_SIGNER_CLIENT_EMAIL / _PRIVATE_KEY / _PRIVATE_KEY_ID
gcloud secrets versions add DEV_APP_SECRETS --data-file=secrets.json --project="$PROJECT"
```

Then force a **new Cloud Run revision** (secrets load at boot; the warm revision
keeps stale config until recycled).

> **Security:** never commit `arcore-signer-key.json`, never ship the private key
> to the client, delete the local JSON once its values are in Secret Manager.

---

## Follow-up (not built here): keep anchors alive indefinitely

Google's Cloud Anchor **Management API** can extend an already-hosted anchor's
`expireTime` server-side (no client re-scan), up to each anchor's
`maximumExpireTime` (1 year from creation):

```
PATCH https://arcore.googleapis.com/v1beta2/management/anchors/{anchorId}?updateMask=expire_time
Authorization: Bearer <OAuth2 access token, scope cloud-platform>
{ "expireTime": "2027-01-01T00:00:00Z" }
```

A scheduled job that PATCHes active anchors before they expire would let anchors
live indefinitely. That access token (scope `cloud-platform`) is where the
Token Creator role granted above is actually used. Tracked as a follow-up; the
token endpoint above is the shipped deliverable.
