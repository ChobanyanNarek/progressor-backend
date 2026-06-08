# Performance testing (k6)

Load-tests the admin + public read endpoints and surfaces query bottlenecks
before they reach production.

## Prerequisites

- Docker running (`postgres` container — `docker compose --env-file /dev/null up -d postgres`).
- Schema applied: `pnpm migration:run`.
- k6 installed: `brew install k6` (free, open-source — runs entirely locally).

## Run

```bash
# 1. Seed bulk data (default 5k creators, 100k points + details)
CREATORS=5000 POINTS=100000 ./scripts/perf/seed.sh

# 2. Start the API
pnpm start:dev          # http://localhost:3000

# 3. Load test (ramps to 1000 VUs)
k6 run scripts/perf/load-test.js
# or smaller: VUS=200 k6 run scripts/perf/load-test.js
```

Login uses the seeded `admin@perf.test` / `Perf1234!`.

## What it exercises (weighted)

| Weight | Endpoint | Query under test |
|---|---|---|
| 25% | `GET /admin/dashboard/stats` | 2× `GROUP BY` counts (role, status) |
| 15% | `GET /admin/dashboard/recent-points` | `ORDER BY created_at DESC LIMIT` + join details |
| 20% | `GET /admin/media` | details ⋈ point, `ORDER BY created_at`, `COUNT(*)` |
| 20% | `GET /users?role&q` | role filter + `firstName/email` search |
| 20% | `GET /memory-points/nearby` | `ST_DWithin` + distance sort (GIST) |

Thresholds (fail the run if exceeded): `http_req_failed < 1%`, p95 per
endpoint 300–500 ms.

## Inspect individual query plans

```bash
docker exec -it postgres psql -U postgres -d postgres
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM memory_points mp
LEFT JOIN memory_point_details d ON d.memory_point_id = mp.id
ORDER BY mp.created_at DESC LIMIT 5;
```

## Known bottlenecks & planned fixes

Static analysis of the current queries (only index today is the spatial GIST on
`memory_points.location`):

| Query | Problem @scale | Fix | Needs migration |
|---|---|---|---|
| recent-points, media, list ordering | `ORDER BY created_at` → seq scan + sort | btree index on `memory_points.created_at` (and `memory_point_details.created_at`) | yes |
| media / list / nearby `q` search | `title ILIKE '%x%'` → seq scan, unindexable as-is | `pg_trgm` GIN index on `memory_point_details.title` (+ `CREATE EXTENSION pg_trgm`) | yes (manual, like the PostGIS extension migration) |
| `/users?q` | `ILIKE` on `first_name`/`email` | `pg_trgm` GIN on those columns | yes |
| dashboard `stats` | 2 full `GROUP BY` counts | acceptable; partial indexes on `status`/`role` if tables grow huge | optional |
| every list (`paginate`) | `COUNT(*)` + rows; count dominates at scale | keyset (cursor) pagination — larger change | no (code) |
| nearby | already uses GIST on `location` ✓ | — | — |

Indexes are applied via a **generated** migration (ADR-0001) once the entity
`@Index` decorators are added; the `pg_trgm` extension + `gin_trgm_ops` indexes
are added by a manual migration (precedent: the PostGIS `CREATE EXTENSION`
migration), since TypeORM metadata can't express trigram ops.
