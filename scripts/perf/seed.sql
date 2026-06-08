-- Performance seed: bulk realistic data for load testing.
-- Run via scripts/perf/seed.sh (injects :creators, :points, :admin_hash).
-- Idempotent: clears prior perf data first.
\set ON_ERROR_STOP on

BEGIN;

-- Wipe (perf data only — points/details are test-only here).
DELETE FROM memory_point_details;
DELETE FROM memory_points;
DELETE FROM users WHERE email = 'admin@perf.test' OR email LIKE 'perf+%@perf.test';

-- Loginable admin (password hash injected by seed.sh).
INSERT INTO users (first_name, last_name, role, email, password, status)
VALUES ('Perf', 'Admin', 'ADMIN', 'admin@perf.test', :'admin_hash', 'ACTIVE');

-- Creators.
INSERT INTO users (first_name, last_name, role, email, password, status)
SELECT 'Creator', 'No' || g, 'CREATOR', 'perf+' || g || '@perf.test', :'admin_hash', 'ACTIVE'
FROM generate_series(1, :creators) AS g;

-- Memory points: spread around a center, mostly APPROVED, created over the last
-- year. Creators assigned by modulo (fast — no per-row random subquery).
WITH creators AS (
  SELECT id, (row_number() OVER (ORDER BY id)) - 1 AS rn
  FROM users WHERE role = 'CREATOR'
), cnt AS (SELECT count(*)::int AS c FROM creators)
INSERT INTO memory_points (location, status, user_id, created_at, updated_at)
SELECT
  ST_SetSRID(
    ST_MakePoint(44.5 + (random() - 0.5) * 0.4, 40.1 + (random() - 0.5) * 0.4),
    4326
  )::geography,
  (ARRAY['APPROVED','APPROVED','APPROVED','PENDING','ADMIN_REVIEWING','REJECTED']
    )[1 + floor(random() * 6)]::memory_points_status_enum,
  cr.id,
  now() - (random() * interval '365 days'),
  now()
FROM generate_series(0, :points - 1) AS g
JOIN cnt ON true
JOIN creators cr ON cr.rn = g % cnt.c;

-- One details row per point.
INSERT INTO memory_point_details
  (title, description, source_photo_url, source_audio_url, type, memory_point_id)
SELECT
  'Memory ' || left(md5(mp.id::text), 8),
  'Description for ' || left(md5(mp.id::text), 16),
  'memory-points/' || mp.id || '/photo/seed.jpg',
  'memory-points/' || mp.id || '/audio/seed.mp3',
  (ARRAY['GRAVE','MEMORIAL','MONUMENT','PLAQUE','HERITAGE']
    )[1 + floor(random() * 5)]::memory_point_details_type_enum,
  mp.id
FROM memory_points mp;

COMMIT;

ANALYZE users;
ANALYZE memory_points;
ANALYZE memory_point_details;

SELECT
  (SELECT count(*) FROM users)                  AS users,
  (SELECT count(*) FROM users WHERE role='ADMIN')   AS admins,
  (SELECT count(*) FROM memory_points)          AS points,
  (SELECT count(*) FROM memory_point_details)   AS details;
