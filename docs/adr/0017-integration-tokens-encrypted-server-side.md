# ADR-0017: Integration tokens are stored encrypted server-side

- **Status**: Accepted
- **Date**: 2026-09-23
- **Deciders**: Backend team

## Context and Problem Statement

The pm-tracker web app connects to Jira, GitHub and GitLab with user-supplied API
tokens. Those tokens lived in the browser and inside the `pm_tracker_state` JSONB
blob: sent to every device on every load, written to the database in plaintext
on every save, and used by the browser to call GitHub and GitLab directly. Any
leak of the blob, a browser extension or an XSS bug exposed every token.

## Decision Outcome

**Integration tokens are stored server-side, encrypted, and never returned.**

- Table `pm_tracker_credential`: one row per user per connection (the
  frontend's connection id), holding an AES-256-GCM envelope `v1.<iv>.<tag>.<data>`
  from `CredentialCipherService`. A fresh random nonce per value; the GCM tag
  makes tampering detectable. The version prefix allows a future scheme without
  rewriting rows in place.
- The key comes from `PM_TRACKER_CREDENTIALS_KEY` (32 bytes, base64). Per
  ADR-0002 there is no code default. It is **not required at boot**: when unset
  the vault reports itself unavailable, the client keeps its tokens locally, and
  the move happens once the key is configured — a deploy made before the key is
  added must not take the service down.
- Credentials are always read and written under the authenticated user; a
  connection id alone can never reach another user's token.
- No endpoint returns a secret. `GET /pm-tracker/credentials` reports which
  connections have one; the plaintext is decrypted only inside a proxy call and
  sent only to the provider.
- GitHub and GitLab calls go through `POST /pm-tracker/github` and
  `/pm-tracker/gitlab` on their fixed hosts (`api.github.com`, `gitlab.com`),
  restricted to an allow-list of the read-only paths the app uses. The Jira
  proxy endpoints accept a `connectionId` in place of a token.

## Consequences

- Rotating the key requires re-encrypting existing rows (decrypt with the old
  key, encrypt with the new). Losing the key makes stored tokens unrecoverable;
  users re-enter them.
- The backend now makes the GitHub/GitLab calls the browser used to make, so
  their rate limits count against the server's egress IP per user token.
