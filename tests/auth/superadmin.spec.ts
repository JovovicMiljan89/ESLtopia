// tests/auth/superadmin.spec.ts
//
// Tests for superadmin permissions.
//
//   * Superadmin sees the Admin tab; teachers and schools do not.
//   * Superadmin can read all profiles via RLS.
//   * Superadmin can update any profile's role via RLS.
//   * Superadmin cannot delete another user's profile via REST — the schema
//     has no DELETE policy for superadmin on profiles, so PostgREST silently
//     drops the request (200 but 0 rows affected). If this test fails it means
//     a DELETE policy has been added and removal now works end-to-end.
//   * Superadmin cannot delete themselves (UI-level guard; no Delete button on
//     their own row).
//   * Superadmin calling manage-teacher is rejected with 403 because that edge
//     function is scoped to School accounts only (gated on FEATURE_SCHOOL_TEACHERS).
//
// Superadmin accounts cannot be created via signup — the trigger coerces any
// unknown role to 'teacher'. Test users are created as teachers and promoted
// via setProfileRole (service-role client, exempt from the column guard).

import { test, expect, type APIRequestContext } from '@playwright/test';
import {
  createConfirmedUser,
  getProfile,
  getAccessToken,
  setProfileRole,
  uniqueEmail,
} from '../helpers/cleanup';
import { loginToApp } from '../helpers/ui';

const PASSWORD = 'Test1234!';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? '';

async function invokeEdgeFn(
  request: APIRequestContext,
  fn: string,
  token: string,
  payload: unknown,
) {
  const res = await request.post(`${SUPABASE_URL}/functions/v1/${fn}`, {
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: payload,
    failOnStatusCode: false,
  });
  let body: unknown = null;
  try { body = await res.json(); } catch { /* ignore */ }
  return { status: res.status(), body };
}

// ─── UI: Admin tab ────────────────────────────────────────────────────────────

test.describe('superadmin: Admin tab visibility', () => {
  const adminEmail = uniqueEmail('sa-ui-admin');
  const targetEmail = uniqueEmail('sa-ui-target');

  test.beforeAll(async () => {
    await createConfirmedUser({ email: adminEmail, password: PASSWORD, role: 'teacher' });
    await getProfile(adminEmail); // wait for trigger
    await setProfileRole(adminEmail, 'superadmin');
    await createConfirmedUser({ email: targetEmail, password: PASSWORD, role: 'teacher' });
  });

  test('superadmin sees the Admin tab', async ({ page }) => {
    await loginToApp(page, adminEmail, PASSWORD);
    await expect(page.locator('button.tab', { hasText: 'Admin' })).toBeVisible();
  });

  test('superadmin sees the user table with Delete buttons for other users', async ({ page }) => {
    await loginToApp(page, adminEmail, PASSWORD);
    await page.locator('button.tab', { hasText: 'Admin' }).click();

    // At least one Delete button must be visible (for the other user)
    await expect(page.locator('button.delete-class-btn', { hasText: 'Delete' }).first()).toBeVisible();
  });

  test('superadmin does not have a Delete button on their own row', async ({ page }) => {
    await loginToApp(page, adminEmail, PASSWORD);
    await page.locator('button.tab', { hasText: 'Admin' }).click();

    // The "You" badge marks the logged-in user's own row
    const ownRow = page.locator('tr', { has: page.locator('span', { hasText: 'You' }) });
    await expect(ownRow.locator('button', { hasText: 'Delete' })).toHaveCount(0);
  });
});

// ─── API: own profile role and full-table listing ────────────────────────────
//
// API backing for the "Admin tab" UI tests:
//   * The Admin tab appears because the app reads the profile and sees
//     role='superadmin' — the first test verifies that at the API level.
//   * The user table is populated by a SELECT * on profiles — the second test
//     verifies a superadmin can do a full-table scan; the third verifies a
//     teacher cannot.

test.describe('superadmin: own profile role and user listing (API)', () => {
  const adminEmail = uniqueEmail('sa-api-role-admin');
  const peerEmail  = uniqueEmail('sa-api-role-peer');

  test.beforeAll(async () => {
    await createConfirmedUser({ email: adminEmail, password: PASSWORD, role: 'teacher' });
    await createConfirmedUser({ email: peerEmail,  password: PASSWORD, role: 'teacher' });
    await getProfile(adminEmail);
    await setProfileRole(adminEmail, 'superadmin');
    await getProfile(peerEmail);
  });

  test('superadmin own profile returns role: superadmin via REST', async ({ request }) => {
    const token = await getAccessToken(adminEmail, PASSWORD);
    const admin = await getProfile(adminEmail);

    const res = await request.get(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${admin?.id}`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` } },
    );
    expect(res.status()).toBe(200);
    const data = await res.json() as Array<{ role: string }>;
    expect(data).toHaveLength(1);
    expect(data[0].role).toBe('superadmin');
  });

  test('superadmin can list all profiles (full-table scan)', async ({ request }) => {
    const token = await getAccessToken(adminEmail, PASSWORD);

    const res = await request.get(
      `${SUPABASE_URL}/rest/v1/profiles`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` } },
    );
    expect(res.status()).toBe(200);
    const data = await res.json() as unknown[];
    // Must see at least the admin + the peer created in beforeAll
    expect(data.length).toBeGreaterThanOrEqual(2);
  });

  test('teacher listing all profiles sees only their own row', async ({ request }) => {
    const token = await getAccessToken(peerEmail, PASSWORD);

    const res = await request.get(
      `${SUPABASE_URL}/rest/v1/profiles`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` } },
    );
    expect(res.status()).toBe(200);
    const data = await res.json() as Array<{ email: string }>;
    expect(data).toHaveLength(1);
    expect(data[0].email).toBe(peerEmail.toLowerCase());
  });
});

// ─── API: RLS — read all profiles ─────────────────────────────────────────────

test.describe('superadmin: RLS — read all profiles', () => {
  const adminEmail = uniqueEmail('sa-rls-read-admin');
  const targetEmail = uniqueEmail('sa-rls-read-target');

  test.beforeAll(async () => {
    await createConfirmedUser({ email: adminEmail, password: PASSWORD, role: 'teacher' });
    await createConfirmedUser({ email: targetEmail, password: PASSWORD, role: 'teacher' });
    await getProfile(adminEmail);
    await setProfileRole(adminEmail, 'superadmin');
    await getProfile(targetEmail);
  });

  test('superadmin can read any user profile via REST', async ({ request }) => {
    const token = await getAccessToken(adminEmail, PASSWORD);
    const target = await getProfile(targetEmail);

    const res = await request.get(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${target?.id}`,
      {
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      },
    );
    expect(res.status()).toBe(200);
    const data = await res.json() as Array<{ email: string }>;
    expect(data).toHaveLength(1);
    expect(data[0].email).toBe(targetEmail.toLowerCase());
  });

  test('teacher cannot read another user profile via REST (RLS blocks it)', async ({ request }) => {
    const teacherEmail = uniqueEmail('sa-rls-read-teacher');
    await createConfirmedUser({ email: teacherEmail, password: PASSWORD, role: 'teacher' });
    const token = await getAccessToken(teacherEmail, PASSWORD);
    const target = await getProfile(targetEmail);

    const res = await request.get(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${target?.id}`,
      {
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      },
    );
    expect(res.status()).toBe(200);
    const data = await res.json() as unknown[];
    // RLS filters the row out — teacher sees an empty result for another user's profile
    expect(data).toHaveLength(0);
  });
});

// ─── API: RLS — update any profile ───────────────────────────────────────────

test.describe('superadmin: RLS — update any profile role', () => {
  const adminEmail = uniqueEmail('sa-rls-upd-admin');
  const targetEmail = uniqueEmail('sa-rls-upd-target');

  test.beforeAll(async () => {
    await createConfirmedUser({ email: adminEmail, password: PASSWORD, role: 'teacher' });
    await createConfirmedUser({ email: targetEmail, password: PASSWORD, role: 'teacher' });
    await getProfile(adminEmail);
    await setProfileRole(adminEmail, 'superadmin');
    await getProfile(targetEmail);
  });

  test('superadmin can change another user role to school via REST', async ({ request }) => {
    const token = await getAccessToken(adminEmail, PASSWORD);
    const target = await getProfile(targetEmail);

    const res = await request.patch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${target?.id}`,
      {
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        data: { role: 'school' },
        failOnStatusCode: false,
      },
    );
    expect(res.status()).toBe(200);
    const updated = await getProfile(targetEmail);
    expect(updated?.role).toBe('school');
  });

  test('teacher cannot change another user role via REST (RLS blocks it)', async ({ request }) => {
    const teacherEmail = uniqueEmail('sa-rls-upd-teacher');
    await createConfirmedUser({ email: teacherEmail, password: PASSWORD, role: 'teacher' });
    const token = await getAccessToken(teacherEmail, PASSWORD);
    const target = await getProfile(targetEmail);
    const roleBefore = target?.role;

    await request.patch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${target?.id}`,
      {
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        data: { role: 'superadmin' },
        failOnStatusCode: false,
      },
    );
    // Role must be unchanged regardless of HTTP status
    const after = await getProfile(targetEmail);
    expect(after?.role).toBe(roleBefore);
  });
});

// ─── API: profile delete ──────────────────────────────────────────────────────
//
// NOTE: The schema currently has no DELETE RLS policy for superadmin on
// profiles (only SELECT and UPDATE). PostgREST responds 200 but deletes 0
// rows, so the "can delete" test below will FAIL until a policy is added:
//
//   create policy "Superadmin can delete any profile"
//     on public.profiles for delete using (get_my_role() = 'superadmin');
//
// The "cannot delete themselves" test documents that self-deletion is blocked
// regardless of the RLS state (the UI skips the delete call for own user;
// at the API level, whether it's blocked depends on policy).

test.describe('superadmin: profile delete via REST', () => {
  const adminEmail = uniqueEmail('sa-del-admin');
  const targetEmail = uniqueEmail('sa-del-target');

  test.beforeAll(async () => {
    await createConfirmedUser({ email: adminEmail, password: PASSWORD, role: 'teacher' });
    await createConfirmedUser({ email: targetEmail, password: PASSWORD, role: 'teacher' });
    await getProfile(adminEmail);
    await setProfileRole(adminEmail, 'superadmin');
    await getProfile(targetEmail);
  });

  test('superadmin can delete another user profile via REST', async ({ request }) => {
    const token = await getAccessToken(adminEmail, PASSWORD);
    const target = await getProfile(targetEmail);

    await request.delete(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${target?.id}`,
      {
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${token}`,
          Prefer: 'return=representation',
        },
        failOnStatusCode: false,
      },
    );

    // Profile must be gone after deletion
    const gone = await getProfile(targetEmail);
    expect(gone).toBeNull();
  });

  test('superadmin own profile cannot be deleted via REST (self-protection)', async ({ request }) => {
    const token = await getAccessToken(adminEmail, PASSWORD);
    const admin = await getProfile(adminEmail);

    await request.delete(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${admin?.id}`,
      {
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${token}`,
          Prefer: 'return=representation',
        },
        failOnStatusCode: false,
      },
    );

    // Own profile must still exist after the attempt
    const still = await getProfile(adminEmail);
    expect(still).not.toBeNull();
  });

  test('teacher cannot delete another user profile via REST (RLS blocks it)', async ({ request }) => {
    const teacherEmail = uniqueEmail('sa-del-teacher-attacker');
    const victimEmail  = uniqueEmail('sa-del-teacher-victim');
    await createConfirmedUser({ email: teacherEmail, password: PASSWORD, role: 'teacher' });
    await createConfirmedUser({ email: victimEmail,  password: PASSWORD, role: 'teacher' });
    await getProfile(victimEmail);

    const token  = await getAccessToken(teacherEmail, PASSWORD);
    const victim = await getProfile(victimEmail);

    await request.delete(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${victim?.id}`,
      {
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${token}`,
          Prefer: 'return=representation',
        },
        failOnStatusCode: false,
      },
    );

    const still = await getProfile(victimEmail);
    expect(still).not.toBeNull();
  });

  test('school cannot delete another user profile via REST (RLS blocks it)', async ({ request }) => {
    const schoolEmail  = uniqueEmail('sa-del-school-attacker');
    const victimEmail  = uniqueEmail('sa-del-school-victim');
    await createConfirmedUser({ email: schoolEmail, password: PASSWORD, role: 'school' });
    await createConfirmedUser({ email: victimEmail, password: PASSWORD, role: 'teacher' });
    await getProfile(victimEmail);

    const token  = await getAccessToken(schoolEmail, PASSWORD);
    const victim = await getProfile(victimEmail);

    await request.delete(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${victim?.id}`,
      {
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${token}`,
          Prefer: 'return=representation',
        },
        failOnStatusCode: false,
      },
    );

    const still = await getProfile(victimEmail);
    expect(still).not.toBeNull();
  });
});

// ─── Edge function: manage-teacher is School-only ────────────────────────────

const ENABLED = process.env.FEATURE_SCHOOL_TEACHERS === '1';

if (!ENABLED) {
  test('superadmin → manage-teacher (skipped until deployed)', () => {
    test.skip(true, 'Deploy migration + edge functions + app, then set FEATURE_SCHOOL_TEACHERS=1');
  });
} else {
  test.describe('superadmin: manage-teacher is blocked (403)', () => {
    const adminEmail = uniqueEmail('sa-manage-admin');
    const schoolEmail = uniqueEmail('sa-manage-school');

    test.beforeAll(async () => {
      await createConfirmedUser({ email: adminEmail, password: PASSWORD, role: 'teacher' });
      await createConfirmedUser({ email: schoolEmail, password: PASSWORD, role: 'school' });
      await getProfile(adminEmail);
      await setProfileRole(adminEmail, 'superadmin');
    });

    test('superadmin calling manage-teacher → 403', async ({ request }) => {
      const adminToken = await getAccessToken(adminEmail, PASSWORD);
      const schoolToken = await getAccessToken(schoolEmail, PASSWORD);

      // Create a real teacher via the school so we have a valid teacherId
      const teacherEmail = uniqueEmail('sa-manage-victim');
      await invokeEdgeFn(request, 'create-teacher', schoolToken, {
        email: teacherEmail,
        firstName: 'Victim',
        lastName: 'Teacher',
      });
      const teacher = await getProfile(teacherEmail);

      const { status } = await invokeEdgeFn(request, 'manage-teacher', adminToken, {
        teacherId: teacher?.id,
        action: 'remove',
      });
      expect(status).toBe(403);
    });

    test('superadmin calling create-teacher → 403', async ({ request }) => {
      const adminToken = await getAccessToken(adminEmail, PASSWORD);

      const { status } = await invokeEdgeFn(request, 'create-teacher', adminToken, {
        email: uniqueEmail('sa-manage-new'),
        firstName: 'New',
        lastName: 'Teacher',
      });
      expect(status).toBe(403);
    });
  });
}
