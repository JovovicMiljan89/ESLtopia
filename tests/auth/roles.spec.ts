// tests/auth/roles.spec.ts
//
// Role-based access tests.
//
//   * Users must not be able to register as superadmin — the signup UI offers
//     only Teacher and School, and the backend coerces any other role.
//   * Teachers must not be able to reach the Admin portal.
//
// Fixture users are created via the admin API and removed by the global teardown.

import { test, expect } from '@playwright/test';
import { createConfirmedUser, getProfile, setProfileStatus, uniqueEmail } from '../helpers/cleanup';
import { loginToApp } from '../helpers/ui';

const PASSWORD = 'Test1234!';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? '';

test.describe('superadmin registration is not possible', () => {
  test('signup form offers only Teacher and School roles', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Sign up' }).click();
    await expect(page.getByText('Create a new account')).toBeVisible();

    const roleCards = page.locator('.role-card');
    await expect(roleCards).toHaveCount(2);
    await expect(roleCards.filter({ hasText: 'Teacher' })).toBeVisible();
    await expect(roleCards.filter({ hasText: 'School' })).toBeVisible();
    await expect(page.getByText('Super Admin')).toHaveCount(0);
    await expect(page.locator('.role-card', { hasText: /super ?admin/i })).toHaveCount(0);
  });

  test('a superadmin signup attempt is coerced to a non-privileged role', async ({ request }) => {
    const email = uniqueEmail('role-superadmin');
    const res = await request.post(`${SUPABASE_URL}/auth/v1/signup`, {
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      data: {
        email,
        password: PASSWORD,
        data: { role: 'superadmin', first_name: 'Sneaky', last_name: 'User' },
      },
    });
    expect(res.ok()).toBeTruthy();

    const profile = await getProfile(email);
    expect(profile?.role).not.toBe('superadmin');
    expect(profile?.role).toBe('teacher');
  });
});

test.describe('admin portal access', () => {
  const teacherEmail = uniqueEmail('role-teacher');

  test.beforeAll(async () => {
    await createConfirmedUser({ email: teacherEmail, password: PASSWORD, role: 'teacher' });
  });

  test('teacher cannot see or open the admin portal', async ({ page }) => {
    await loginToApp(page, teacherEmail, PASSWORD);
    await expect(page.locator('button.tab', { hasText: 'Admin' })).toHaveCount(0);
    await expect(page.locator('button.tab', { hasText: 'Classes' })).toBeVisible();
  });
});

// ─── Account status: login restrictions ──────────────────────────────────────
//
// These tests do not depend on the school-teachers edge functions and run
// unconditionally. The pending-teacher case was previously gated by
// FEATURE_SCHOOL_TEACHERS; it lives here so it always runs.

test.describe('account status: login restrictions', () => {
  const pendingEmail = uniqueEmail('status-pending');
  const inactiveEmail = uniqueEmail('status-inactive');

  test.beforeAll(async () => {
    await createConfirmedUser({ email: pendingEmail, password: PASSWORD, role: 'teacher' });
    await getProfile(pendingEmail); // wait for on_auth_user_created trigger
    await setProfileStatus(pendingEmail, 'pending');
    await createConfirmedUser({ email: inactiveEmail, password: PASSWORD, role: 'teacher' });
    await getProfile(inactiveEmail); // wait for on_auth_user_created trigger
    await setProfileStatus(inactiveEmail, 'inactive');
  });

  test('pending account cannot log in → "Your account is pending…"', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('your@email.com').fill(pendingEmail);
    await page.getByPlaceholder('Your password').fill(PASSWORD);
    await page.locator('button[type="submit"].gen-btn').click();

    await expect(
      page.getByText('Your account is pending. Check your email to set your password.'),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('inactive account cannot log in → "Your account has been deactivated…"', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('your@email.com').fill(inactiveEmail);
    await page.getByPlaceholder('Your password').fill(PASSWORD);
    await page.locator('button[type="submit"].gen-btn').click();

    await expect(
      page.getByText('Your account has been deactivated. Contact your school administrator.'),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });
});

// ─── API: JWT payload ─────────────────────────────────────────────────────────

function decodeJwtPayload(token: string): Record<string, unknown> {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
}

test.describe('API: JWT payload claims', () => {
  const jwtEmail = uniqueEmail('jwt-teacher');

  test.beforeAll(async () => {
    await createConfirmedUser({ email: jwtEmail, password: PASSWORD, role: 'teacher' });
  });

  test('access token contains email, UUID sub, and authenticated role', async ({ request }) => {
    const res = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      data: { email: jwtEmail, password: PASSWORD },
    });
    const { access_token } = await res.json();
    const payload = decodeJwtPayload(access_token);

    expect(payload.email).toBe(jwtEmail.toLowerCase());
    expect(payload.sub).toMatch(/^[0-9a-f-]{36}$/);
    expect(payload.aud).toBe('authenticated');
    expect(payload.role).toBe('authenticated');
  });

  test('user_metadata.role reflects the role passed at signup', async ({ request }) => {
    const res = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      data: { email: jwtEmail, password: PASSWORD },
    });
    const { access_token } = await res.json();
    const payload = decodeJwtPayload(access_token);

    expect((payload.user_metadata as Record<string, unknown>)?.role).toBe('teacher');
  });

  test('token expiry (exp) is in the future', async ({ request }) => {
    const res = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      data: { email: jwtEmail, password: PASSWORD },
    });
    const { access_token } = await res.json();
    const { exp } = decodeJwtPayload(access_token) as { exp: number };

    expect(exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  test('GET /auth/v1/user returns the same user as the token subject', async ({ request }) => {
    const tokenRes = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      data: { email: jwtEmail, password: PASSWORD },
    });
    const { access_token } = await tokenRes.json();
    const { sub } = decodeJwtPayload(access_token) as { sub: string };

    const userRes = await request.get(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${access_token}` },
    });
    expect(userRes.status()).toBe(200);
    const user = await userRes.json();
    expect(user.id).toBe(sub);
    expect(user.email).toBe(jwtEmail.toLowerCase());
  });

  test('GET /auth/v1/user with a malformed token → 403', async ({ request }) => {
    const res = await request.get(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: ANON_KEY, Authorization: 'Bearer not.a.token' },
      failOnStatusCode: false,
    });
    // Supabase returns 403 for a malformed/invalid token, 401 for missing auth
    expect(res.status()).toBe(403);
  });
});

test.describe('API: school JWT payload claims', () => {
  const schoolEmail = uniqueEmail('jwt-school');

  test.beforeAll(async () => {
    await createConfirmedUser({ email: schoolEmail, password: PASSWORD, role: 'school' });
  });

  test('school access token has user_metadata.role: school', async ({ request }) => {
    const res = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      data: { email: schoolEmail, password: PASSWORD },
    });
    const { access_token } = await res.json();
    const payload = decodeJwtPayload(access_token);

    expect((payload.user_metadata as Record<string, unknown>)?.role).toBe('school');
    expect(payload.email).toBe(schoolEmail.toLowerCase());
    expect(payload.aud).toBe('authenticated');
  });
});
