// tests/app/profile.spec.ts
//
// Tests for profile self-management via the REST API.
//
// RLS:
//   "Users can update own profile":  id = auth.uid()
//   "Superadmin can update any profile": jwt role = superadmin
//
// The guard_profile_columns_trg trigger blocks changes to role/status/school_id
// for regular users — first_name, last_name, middle_name and email are free to update.

import { test, expect } from '@playwright/test';
import {
  createConfirmedUser,
  getAccessToken,
  getProfile,
  setProfileRole,
  uniqueEmail,
} from '../helpers/cleanup';

const PASSWORD = 'Test1234!';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? '';

function h(token: string, extra: Record<string, string> = {}) {
  return {
    apikey: ANON_KEY,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

// ─── Profile: self-management ─────────────────────────────────────────────────

test.describe('profile: self-management', () => {
  const email = uniqueEmail('prof-self');
  let userId: string;
  let token: string;

  test.beforeAll(async () => {
    await createConfirmedUser({ email, password: PASSWORD, role: 'teacher' });
    const profile = await getProfile(email);
    userId = profile!.id;
    token = await getAccessToken(email, PASSWORD);
  });

  test('teacher can update their own first_name', async ({ request }) => {
    const res = await request.patch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
      {
        headers: h(token, { Prefer: 'return=representation' }),
        data: { first_name: 'UpdatedFirst' },
      },
    );
    expect(res.status()).toBe(200);
    const rows = await res.json() as Array<{ first_name: string }>;
    expect(rows[0].first_name).toBe('UpdatedFirst');
  });

  test('teacher can update their own last_name', async ({ request }) => {
    const res = await request.patch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
      {
        headers: h(token, { Prefer: 'return=representation' }),
        data: { last_name: 'UpdatedLast' },
      },
    );
    expect(res.status()).toBe(200);
    const rows = await res.json() as Array<{ last_name: string }>;
    expect(rows[0].last_name).toBe('UpdatedLast');
  });

  test('teacher cannot update their own role (trigger blocks it)', async ({ request }) => {
    await request.patch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
      {
        headers: h(token, { Prefer: 'return=representation' }),
        data: { role: 'superadmin' },
        failOnStatusCode: false,
      },
    );
    // Role must remain teacher regardless of the HTTP response
    const after = await getProfile(email);
    expect(after?.role).toBe('teacher');
  });

  test("teacher cannot update another user's profile (RLS blocks it)", async ({ request }) => {
    const peerEmail = uniqueEmail('prof-peer');
    await createConfirmedUser({ email: peerEmail, password: PASSWORD, role: 'teacher' });
    const peer = await getProfile(peerEmail);

    const res = await request.patch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${peer?.id}`,
      {
        headers: h(token, { Prefer: 'return=representation' }),
        data: { first_name: 'Hacked' },
        failOnStatusCode: false,
      },
    );
    // RLS: id = auth.uid() → peer.id ≠ userId → 0 rows matched, empty array returned
    const rows = await res.json() as unknown[];
    expect(rows).toHaveLength(0);

    // Confirm the peer's name is unchanged
    const peerAfter = await getProfile(peerEmail);
    expect(peerAfter?.first_name ?? '').not.toBe('Hacked');
  });
});

// ─── Profile: superadmin can update any user's name ──────────────────────────

test.describe("profile: superadmin can update any user's name fields", () => {
  const adminEmail = uniqueEmail('prof-sa-admin');
  const targetEmail = uniqueEmail('prof-sa-target');
  let adminToken: string;
  let targetId: string;

  test.beforeAll(async () => {
    await createConfirmedUser({ email: adminEmail, password: PASSWORD, role: 'teacher' });
    await createConfirmedUser({ email: targetEmail, password: PASSWORD, role: 'teacher' });
    await getProfile(adminEmail);
    await setProfileRole(adminEmail, 'superadmin');
    const target = await getProfile(targetEmail);
    targetId = target!.id;
    adminToken = await getAccessToken(adminEmail, PASSWORD);
  });

  test("superadmin can update any user's first_name", async ({ request }) => {
    const res = await request.patch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${targetId}`,
      {
        headers: h(adminToken, { Prefer: 'return=representation' }),
        data: { first_name: 'AdminChanged' },
      },
    );
    expect(res.status()).toBe(200);
    const rows = await res.json() as Array<{ first_name: string }>;
    expect(rows[0].first_name).toBe('AdminChanged');
  });
});
