// loadtests/records-write-load-test.js
//
// Load test for POST /rest/v1/records (merge-duplicates upsert) — the app's
// actual hot write path (every attendance/grade/payment click debounces into
// one of these calls, see syncRecord in src/EnglishGenerator.jsx). The review
// that prompted this suite assumed a "worksheet-generate" API endpoint, but
// worksheet generation is pure client-side JS (generateTasks()) with no
// network call to load-test — this is the closest real write-heavy endpoint.
//
// Run with:
//   SUPABASE_URL=... ANON_KEY=... SERVICE_ROLE_KEY=... k6 run loadtests/records-write-load-test.js
//
// All VUs share one teacher account + one class (created in setup(), removed
// in teardown()), simulating many concurrent debounced writes from the same
// browser tab rather than many different teachers.
//
// The class id is generated INSIDE setup() and threaded through via its
// return value (read by both default() and teardown()) rather than as a
// module-level `Date.now()` constant — k6 re-evaluates each script's
// top-level code once per VU (and again for setup/teardown), so a
// module-level "unique" id resolves to a different value in every context.
//
// Measured result (2026-07-05, 20 VUs/15s, hosted Supabase free tier, this
// project): 100% success, ~222 req/s, p95 ~97ms. Unlike the auth token
// endpoint (see login-load-test.js), this REST write path has no per-request
// rate limiter and scales cleanly at this load level.

import http from 'k6/http';
import { check } from 'k6';

const SUPABASE_URL = __ENV.SUPABASE_URL;
const ANON_KEY = __ENV.ANON_KEY;
const SERVICE_ROLE_KEY = __ENV.SERVICE_ROLE_KEY;
const EMAIL = 'k6-records-load@example.test';
const PASSWORD = 'Test1234!';

export const options = {
  stages: [
    { duration: '20s', target: 10 },
    { duration: '40s', target: 20 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
  },
};

function adminHeaders() {
  return { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' };
}

export function setup() {
  const classId = `c_k6load_${Date.now()}`;

  http.post(
    `${SUPABASE_URL}/auth/v1/admin/users`,
    JSON.stringify({ email: EMAIL, password: PASSWORD, email_confirm: true, user_metadata: { role: 'teacher', first_name: 'K6', last_name: 'Records' } }),
    { headers: adminHeaders() },
  );

  const loginRes = http.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    JSON.stringify({ email: EMAIL, password: PASSWORD }),
    { headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' } },
  );
  const token = loginRes.json('access_token');

  const profileRes = http.get(`${SUPABASE_URL}/rest/v1/profiles?email=eq.${EMAIL}`, { headers: adminHeaders() });
  const teacherId = profileRes.json('0.id');

  http.post(
    `${SUPABASE_URL}/rest/v1/classes`,
    JSON.stringify({ id: classId, name: 'K6 Load Class', owner_id: teacherId, students: ['Alice'] }),
    { headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
  );

  return { token, teacherId, classId };
}

export default function (data) {
  const res = http.post(
    `${SUPABASE_URL}/rest/v1/records`,
    JSON.stringify({
      class_id: data.classId,
      owner_id: data.teacherId,
      data: { attendance: { [Date.now()]: { Alice: true } }, payment: {}, grades: {} },
      updated_at: new Date().toISOString(),
    }),
    {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${data.token}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
    },
  );
  check(res, { 'status is 200 or 201': (r) => r.status === 200 || r.status === 201 });
}

export function teardown(data) {
  http.del(`${SUPABASE_URL}/rest/v1/classes?id=eq.${data.classId}`, null, { headers: adminHeaders() });
  const res = http.get(`${SUPABASE_URL}/auth/v1/admin/users?email=${EMAIL}`, { headers: adminHeaders() });
  const users = res.json('users') || [];
  for (const u of users) {
    http.del(`${SUPABASE_URL}/auth/v1/admin/users/${u.id}`, null, { headers: adminHeaders() });
  }
}
