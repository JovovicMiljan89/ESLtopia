// tests/auth/logout.spec.ts
//
// E2E + API tests for signing out.
//
// UI: clicking Sign out returns to the login screen and a reload stays
// logged out (no persisted session).
//
// API: POST /auth/v1/logout — verifies 204 response and that the revoked
// token is rejected on subsequent requests.

import { test, expect } from '@playwright/test';
import { createConfirmedUser, getAccessToken, uniqueEmail } from '../helpers/cleanup';
import { loginToApp } from '../helpers/ui';

const PASSWORD = 'Test1234!';
const EMAIL = uniqueEmail('logout');
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? '';

test.beforeAll(async () => {
  await createConfirmedUser({ email: EMAIL, password: PASSWORD, role: 'teacher' });
});

// ─── UI ───────────────────────────────────────────────────────────────────────

test('sign out returns to the login screen', async ({ page }) => {
  await loginToApp(page, EMAIL, PASSWORD);
  await page.getByRole('button', { name: /sign out/i }).click();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByPlaceholder('your@email.com')).toBeVisible();
});

test('sign out clears the session (reload stays logged out)', async ({ page }) => {
  await loginToApp(page, EMAIL, PASSWORD);
  await page.getByRole('button', { name: /sign out/i }).click();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible({ timeout: 10_000 });

  // A persisted session would auto-log-in on reload; we should stay logged out.
  await page.reload();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('button', { name: /sign out/i })).toHaveCount(0);
});

// ─── API ──────────────────────────────────────────────────────────────────────

test.describe('API: POST /auth/v1/logout', () => {
  test('valid token → 204 No Content', async ({ request }) => {
    const token = await getAccessToken(EMAIL, PASSWORD);
    const res = await request.post(`${SUPABASE_URL}/auth/v1/logout`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(204);
  });

  test('revoked token is rejected on subsequent requests', async ({ request }) => {
    const token = await getAccessToken(EMAIL, PASSWORD);

    await request.post(`${SUPABASE_URL}/auth/v1/logout`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    });

    const userRes = await request.get(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    });
    // Supabase returns 403 for a revoked token (vs 401 for missing auth)
    expect(userRes.status()).toBe(403);
  });

  test('no Authorization header → 401', async ({ request }) => {
    const res = await request.post(`${SUPABASE_URL}/auth/v1/logout`, {
      headers: { apikey: ANON_KEY },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(401);
  });
});
