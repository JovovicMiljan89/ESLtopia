// loadtests/login-load-test.js
//
// Load test for POST /auth/v1/token (password grant) — the login endpoint
// every session starts with. Run with:
//
//   SUPABASE_URL=... ANON_KEY=... SERVICE_ROLE_KEY=... k6 run loadtests/login-load-test.js
//
// (PowerShell: $env:SUPABASE_URL="..."; $env:ANON_KEY="..."; $env:SERVICE_ROLE_KEY="..."; k6 run loadtests/login-load-test.js)
//
// Values match .env.test.local: SUPABASE_URL=VITE_SUPABASE_URL,
// ANON_KEY=VITE_SUPABASE_ANON_KEY, SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY.
//
// Uses a pool of dedicated @example.test accounts (created in setup(),
// removed in teardown()), one per VU. A single shared account trips
// Supabase's PER-ACCOUNT sign-in throttle almost instantly regardless of
// overall request rate -- that measures the wrong thing. Many accounts
// logging in concurrently is what actually models production traffic
// (many different teachers signing in around the same time).
//
// Measured result (2026-07-05, full ramp: 10 VUs/20s -> 20 VUs/40s -> 0/20s,
// hosted Supabase free tier, this project): only ~8% of logins succeeded at
// peak (69/831 total over the run) once concurrency climbed past a handful
// of requests/sec -- the rest got 429 {"error_code":"over_request_rate_
// limit"}, Supabase's own project-wide auth rate limit, not an app bug.
// Successful requests still stayed fast (p95 ~181ms). Treat any non-trivial
// http_req_failed rate here as "found the limiter," not "broken."

import http from 'k6/http';
import { check, sleep } from 'k6';

const SUPABASE_URL = __ENV.SUPABASE_URL;
const ANON_KEY = __ENV.ANON_KEY;
const SERVICE_ROLE_KEY = __ENV.SERVICE_ROLE_KEY;
const PASSWORD = 'Test1234!';
const POOL_SIZE = 20;

export const options = {
  stages: [
    { duration: '20s', target: 10 },
    { duration: '40s', target: 20 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    // Only gate on latency. Supabase's own auth rate limiter (see header
    // note) is expected to reject a chunk of requests once concurrency
    // climbs past its threshold -- that's the finding, not a failure to
    // assert away with an error-rate threshold.
    http_req_duration: ['p(95)<1000'],
  },
};

function adminHeaders() {
  return { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' };
}

function poolEmail(i) {
  return `k6-login-load-${i}@example.test`;
}

export function setup() {
  for (let i = 0; i < POOL_SIZE; i++) {
    http.post(
      `${SUPABASE_URL}/auth/v1/admin/users`,
      JSON.stringify({
        email: poolEmail(i),
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { role: 'teacher', first_name: 'K6', last_name: `Login${i}` },
      }),
      { headers: adminHeaders() },
    );
    // 200/422 (already registered) are both fine — idempotent setup.
  }
}

export default function () {
  const email = poolEmail(__VU % POOL_SIZE);
  const res = http.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    JSON.stringify({ email, password: PASSWORD }),
    { headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' } },
  );
  check(res, {
    'status is 200': (r) => r.status === 200,
    'has access_token': (r) => !!r.json('access_token'),
  });
  sleep(1);
}

export function teardown() {
  for (let i = 0; i < POOL_SIZE; i++) {
    const res = http.get(`${SUPABASE_URL}/auth/v1/admin/users?email=${poolEmail(i)}`, { headers: adminHeaders() });
    const users = res.json('users') || [];
    for (const u of users) {
      http.del(`${SUPABASE_URL}/auth/v1/admin/users/${u.id}`, null, { headers: adminHeaders() });
    }
  }
}
