// k6 load test for the admin + public read endpoints.
//   k6 run scripts/perf/load-test.js
//   BASE_URL=http://localhost:3000 VUS=1000 k6 run scripts/perf/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://localhost:3000';
const EMAIL = __ENV.ADMIN_EMAIL || 'admin@perf.test';
const PASSWORD = __ENV.ADMIN_PASSWORD || 'Perf1234!';
const PEAK = Number(__ENV.VUS || 1000);

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
    'http_req_duration{name:dashboard_stats}': ['p(95)<300'],
    'http_req_duration{name:recent_points}': ['p(95)<300'],
    'http_req_duration{name:media}': ['p(95)<500'],
    'http_req_duration{name:users}': ['p(95)<500'],
    'http_req_duration{name:nearby}': ['p(95)<400'],
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
  return { token };
}

export default function (data) {
  const auth = {
    headers: { Authorization: `Bearer ${data.token}` },
  };
  const page = 1 + Math.floor(Math.random() * 50);
  const r = Math.random();
  let res;

  if (r < 0.25) {
    res = http.get(`${BASE}/admin/dashboard/stats`, {
      ...auth,
      tags: { name: 'dashboard_stats' },
    });
  } else if (r < 0.4) {
    res = http.get(`${BASE}/admin/dashboard/recent-points?limit=5`, {
      ...auth,
      tags: { name: 'recent_points' },
    });
  } else if (r < 0.6) {
    res = http.get(`${BASE}/admin/media?page=${page}&take=20`, {
      ...auth,
      tags: { name: 'media' },
    });
  } else if (r < 0.8) {
    res = http.get(`${BASE}/users?role=CREATOR&page=${page}&take=20&q=perf`, {
      ...auth,
      tags: { name: 'users' },
    });
  } else {
    // Public — no auth.
    res = http.get(
      `${BASE}/memory-points/nearby?latitude=40.1&longitude=44.5&radiusMeters=5000&page=1&take=20`,
      { tags: { name: 'nearby' } },
    );
  }

  check(res, { 'status 200': (x) => x.status === 200 });
  sleep(0.5);
}
