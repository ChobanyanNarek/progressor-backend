// k6 stress test for the JOIN-heavy admin read endpoints.
//
// These endpoints each fan a list/detail query across multiple tables, so they
// are the ones most likely to regress under load (sequential scans, N+1, or a
// missing index on a join key). Covered joins:
//   - GET /admin/memory-points      mp -> memory_point_details, mp -> users
//   - GET /admin/memory-points/{id} mp -> users (+ details)
//   - GET /admin/jobs               ai_generation -> mp -> memory_point_details
//   - GET /admin/media              memory_point_details -> mp
//
// Run:
//   k6 run scripts/perf/joins-load-test.js
//   BASE_URL=http://localhost:3000 VUS=500 k6 run scripts/perf/joins-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://localhost:3000';
const EMAIL = __ENV.ADMIN_EMAIL || 'admin@perf.test';
const PASSWORD = __ENV.ADMIN_PASSWORD || 'Perf1234!';
const PEAK = Number(__ENV.VUS || 500);

export const options = {
  scenarios: {
    ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: Math.round(PEAK * 0.2) },
        { duration: '1m', target: PEAK },
        { duration: '1m', target: PEAK },
        { duration: '30s', target: 0 },
      ],
      gracefulStop: '15s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    // Join lists fan across 2-3 tables; allow a bit more headroom than a
    // single-table read but still index-backed (no seq scans).
    'http_req_duration{name:admin_points_list}': ['p(95)<600'],
    'http_req_duration{name:admin_point_detail}': ['p(95)<400'],
    'http_req_duration{name:admin_jobs}': ['p(95)<600'],
    'http_req_duration{name:admin_media}': ['p(95)<600'],
  },
};

export function setup() {
  const res = http.post(
    `${BASE}/auth/login`,
    JSON.stringify({ email: EMAIL, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(res, { 'login ok': (r) => r.status === 200 || r.status === 201 });
  const token = res.json('accessToken.token');
  if (!token) throw new Error(`login failed: ${res.status} ${res.body}`);

  // Grab a real point id so the detail endpoint exercises its user join on an
  // existing row rather than 404-ing.
  const auth = { headers: { Authorization: `Bearer ${token}` } };
  const list = http.get(`${BASE}/admin/memory-points?page=1&take=1`, auth);
  const sampleId = list.json('data.0.id') || null;

  return { token, sampleId };
}

export default function (data) {
  const auth = {
    headers: { Authorization: `Bearer ${data.token}` },
  };
  const page = 1 + Math.floor(Math.random() * 50);
  const r = Math.random();
  let res;

  if (r < 0.3) {
    // mp -> details + mp -> users, with the search predicate on the trigram idx.
    res = http.get(`${BASE}/admin/memory-points?page=${page}&take=20&q=a`, {
      ...auth,
      tags: { name: 'admin_points_list' },
    });
  } else if (r < 0.55) {
    // ai_generation -> mp -> details
    const status = Math.random() < 0.5 ? '' : '&status=COMPLETED';
    res = http.get(`${BASE}/admin/jobs?page=${page}&take=20${status}`, {
      ...auth,
      tags: { name: 'admin_jobs' },
    });
  } else if (r < 0.8) {
    // memory_point_details -> mp
    res = http.get(`${BASE}/admin/media?page=${page}&take=20`, {
      ...auth,
      tags: { name: 'admin_media' },
    });
  } else if (data.sampleId) {
    // mp -> users (+ details) on a single row.
    res = http.get(`${BASE}/admin/memory-points/${data.sampleId}`, {
      ...auth,
      tags: { name: 'admin_point_detail' },
    });
  } else {
    res = http.get(`${BASE}/admin/memory-points?page=1&take=20`, {
      ...auth,
      tags: { name: 'admin_points_list' },
    });
  }

  check(res, { 'status 200': (x) => x.status === 200 });
  sleep(0.5);
}
