# Backend → Frontend handoff — Admin v1 delivery

Branch: `feature/admin-v1-delivery` → `develop`. API (dev): `https://api-dev.evmemory.com` · Swagger `/documentation` (JSON `/documentation-json`).

This covers everything the backend changed for the admin v1 release, mapped to the FE delivery spec (§ references). Conventions match the existing live endpoints (Bearer JWT, `{ data, meta }` envelope, `page/take/order/q` params).

> **Non-admin access:** every `/admin/*` route is `@Auth([RoleType.ADMIN])`. A **valid CREATOR token → `403 Forbidden`** (passes auth, fails role). A **missing/invalid token → `401`**. (The spec said 401 for non-admin; the accurate status is **403** for an authenticated non-admin.)

---

## 0. Deploy / migration note

One generated migration ships in this PR (`...-admin-logs-and-nullable-detail-sources`). It is applied automatically on deploy (`pnpm migration:run`). It (a) creates `admin_log_entries`, (b) makes `memory_point_details.source_photo_url` / `source_audio_url` nullable. No action for FE beyond knowing the new endpoints below exist after deploy.

---

## 1. New endpoints

### 1.1 `GET /admin/logs` — logs & diagnostics (A11) + activity feed (A2)

```
GET /admin/logs?page=1&take=20&order=DESC&level=&source=&from=&to=&q=&memoryPointId=
```

| Param | Type | Notes |
|---|---|---|
| `page,take,order,q` | — | standard envelope params |
| `level` | `info \| warn \| error` | optional |
| `source` | `api \| ar \| did \| maps \| auth` | optional (A11 chip tabs) |
| `from,to` | ISO 8601 | optional inclusive time window on `timestamp` |
| `memoryPointId` | uuid | **optional — logs for one point** (A5 / A11 filter) |

Response: standard `{ data, meta }`. **Per-source counts live in `meta.counts`** (chosen over a sibling endpoint):

```jsonc
"meta": {
  "page": 1, "take": 20, "itemCount": 0, "pageCount": 0,
  "hasPreviousPage": false, "hasNextPage": false,
  "counts": { "api": 0, "ar": 0, "did": 0, "maps": 0, "auth": 0 }
}
```
Counts reflect the active `level`/`from`/`to`/`q`/`memoryPointId` filters but **not** `source` (so the per-source breakdown stays visible when a source tab is selected).

Row (`AdminLogEntryDto`):
```ts
interface AdminLogEntryDto {
  id: string;                 // uuid
  timestamp: string;          // ISO 8601 (event time)
  level: 'info' | 'warn' | 'error';
  source: 'api' | 'ar' | 'did' | 'maps' | 'auth';
  message: string;
  memoryPointId?: string | null;       // set on point-related entries (e.g. did)
  context?: Record<string, unknown>;   // structured payload, shown on row expand
  createdAt: string; updatedAt: string;
}
```
Status: `200` · `403` non-admin.

> **⚠️ Data availability — read this.** The table is **live but only partially populated**. Producers wired now:
> - **`did`** — D-ID video lifecycle (`completed` → info, `failed` → error), with `memoryPointId` + `context.{generationId, didTalkId}`.
> - **`api`** — database query failures (level `error`).
>
> **No producers yet for `auth`, `ar`, `maps`** (the enum values exist for the chip tabs, but those sources return nothing until wired). So early on the console will be sparse / D-ID-heavy. The optional SSE live-tail (`/admin/logs/stream`) was **not** built — poll.

### 1.2 `GET /admin/jobs` — AI queue list (A2 dashboard widget) [read-only]

```
GET /admin/jobs?page=1&take=20&order=DESC&status=
```
`status` (optional) = `PENDING | PROCESSING | COMPLETED | FAILED`.

Row (`AdminAiJobDto`):
```ts
interface AdminAiJobDto {
  id: string;                       // generation id (uuid)
  memoryPointId: string;            // uuid
  memoryPointTitle: string | null;  // joined — no N+1 needed
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  didTalkId?: string;
  resultVideoUrl?: string;
  errorMessage?: string;
  durationSeconds?: number;
  attemptNumber?: number;
  createdAt: string; updatedAt: string;
}
```
Standard `{ data, meta }`. Status `200` · `403`.

---

## 2. Changes to existing endpoints

### 2.1 + 2.2 `GET /admin/memory-points` — new row fields + embedded creator

Rows now also include:
```ts
userId: string;                    // creator id
type: MemoryPointType | null;      // null only for a metadata-incomplete row
photoUrl: string | null;           // source photo (GCS path), null until uploaded
creator: {                         // embedded — no extra /users call
  id: string; firstName: string; lastName: string; email: string; avatar: string | null;
} | null;
```
`creator` is typed `| null` (contract-faithful); in practice it is always present (every point has a creator). Existing fields (`id`, `location`, `status`, `title`, `description`, `createdAt`, `updatedAt`) unchanged. PENDING drafts remain excluded from this list.

### 2.2 `GET /admin/memory-points/{id}` — embedded creator

Detail response now includes the same `creator` object (`| null`) plus the existing `userId`. Admin GET-by-id returns a point in **any** status (including PENDING) — only the list hides PENDING.

### 2.3 `PATCH /admin/memory-points/{id}/details` — now upserts (404 bug fixed)

Patching details on a fresh point that has **no details row yet** previously returned `404 error.memoryPointNotFound`. It now **upserts**: creates the row if absent (metadata-only), updates if present. Body unchanged: `{ title?, description?, cloudAnchorId?, type? }`. Returns **`204`**. A genuinely unknown point id still `404`s. Editing details does **not** change the point's status.

---

## 3. Pagination & validation — now actually enforced (affects ALL list endpoints)

Two latent bugs in the shared pagination DTO were fixed; behaviour is now what the contract always promised:

- **Defaults apply when params are omitted:** `page=1`, `take=10`, `order=ASC` (previously omitting them caused a `500`). Safe to call any list endpoint with no paging params.
- **Bounds are enforced (→ `422` when violated):** `page ≥ 1`, `take 1–50`. Also `recent-points` `limit 1–20` (default 5), and `GET /memory-points/nearby` `radiusMeters` is now optional (default `5000`, range `100–50000`). Previously these bounds were documented-only and unvalidated, so e.g. `take=100000` was accepted — now rejected.

No request shape changed; if the FE already sends in-range `page`/`take`, nothing to do.

---

## 4. Unchanged / confirmations

- **Roles:** final set is **`CREATOR` + `ADMIN`** only. Confirmed.
- **Error codes:** no new codes introduced; API errors remain stable `error.*` codes (FE owns localization, per ADR-0015). Existing codes documented in `docs/error-codes.md`.
- **Deferred (no change, still not built):** A8 full queue write ops (`POST/PATCH /admin/jobs`), A9 D-ID settings, A10 maps, A12 settings/team, A7 media write. Per-point video gen unchanged (`POST /admin/memory-points/{id}/generate-video`).

---

## 5. Open follow-ups (so FE can plan)

1. **Log producers for `auth` / `ar` / `maps`** are not wired — those chip tabs stay empty until a later ticket.
2. **`api` log source = DB query failures only**; generic non-DB 5xx aren't captured yet (needs a catch-all filter).
3. **No SSE log stream** (`/admin/logs/stream`) — poll `GET /admin/logs`.
4. **Seed data** on `api-dev` is an ops task (not in this PR).
