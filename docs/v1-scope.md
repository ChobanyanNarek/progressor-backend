# Backend v1 scope — what ships vs what does not

For the frontend team. Snapshot as of the `feature/admin-endpoints` PR.
Screens that call a NOT-shipping endpoint should be hidden/disabled or stubbed —
the backend returns `404` for them.

## ✅ Shipping in v1

### Auth
- `POST /auth/login`
- `GET /auth/me`

### Users (admin)
- `GET /users` (paginated: `page`, `take`, `order`, `q`, `role`, `status`)
- `POST /users` (create — role `CREATOR` or `ADMIN`)
- `GET /users/{id}`
- `PATCH /users/{id}` (edit)
- `DELETE /users/{id}`
- `PATCH /users/{id}/role`
- `PATCH /users/{id}/status`

### Dashboard
- `GET /admin/dashboard/stats`
- `GET /admin/dashboard/recent-points?limit=` (returns `{ items: [...] }`, not a bare array — ADR-0016)

### Memory points (admin)
- `GET /admin/memory-points`
- `GET /admin/memory-points/{id}`
- `PATCH /admin/memory-points/{id}/status`
- `PATCH /admin/memory-points/{id}/details`
- `DELETE /admin/memory-points/{id}`
- `POST /admin/memory-points/{id}/generate-video`
- `GET /admin/memory-points/{id}/video-status`

### Media (admin) — read-only
- `GET /admin/media` (paginated list of each point's photo/audio/video bundle)

### Memory points (creator / public)
- `POST /creator/memory-points`, `POST /creator/memory-points/{id}/upload-url`,
  `POST /creator/memory-points/{id}/details`, `GET /creator/memory-points/mine`,
  `GET /creator/memory-points/{id}`
- `GET /memory-points/nearby` (now returns the full list shape: `status`,
  `title`, `description`, `createdAt`, `updatedAt`)
- `GET /memory-points/{id}`

## ❌ NOT shipping in v1 — backend returns 404

| Admin screen | Endpoints the UI calls | Status |
|---|---|---|
| **Team / Settings (A12)** | `GET /admin/settings/team`, `POST /admin/team/invite`, `DELETE /admin/team/{id}`, `GET/PATCH /admin/settings/org` | **Cut from v1.** No team management / admin invites / org settings. Hide these screens. Admins are created via `POST /users` (role `ADMIN`) if needed. |
| **Media writes (A7)** | `DELETE /admin/media/{id}`, `PATCH /admin/media/{id}` | Media is **read-only** in v1 (`GET /admin/media` only). Hide delete/edit controls. |
| **AI jobs (A8)** | `GET/POST /admin/jobs`, `PATCH /admin/jobs/{id}` | Out of v1. |
| **Maps (A6 / A10)** | `GET /admin/maps/queue`, `POST /admin/maps/sync`, `PATCH /admin/maps/listings/{id}`, `POST /admin/maps/listings/{id}/regenerate-link` | Out of v1. |
| **D-ID settings (A9)** | `GET/PATCH /admin/did/settings` | Out of v1. (Video generation itself ships via the memory-point endpoints above; the settings screen does not.) |
| **Logs (A11)** | `GET /admin/logs`, `POST /admin/logs/{id}/retry` | Out of v1 (needs an audit-log table + spec). |

## Notes

- **Errors** carry a stable **code** (e.g. `error.invalidCredentials`), not a
  localized message — the frontend localizes. See
  [`docs/error-codes.md`](error-codes.md) and
  [ADR-0015](adr/0015-api-errors-return-codes-not-translations.md).
- **Roles** are `CREATOR` and `ADMIN` only — no `USER`/`visitor`.
- **`/admin/points`** is a dead duplicate — use `/admin/memory-points`.
