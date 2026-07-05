// tests/auth/registration.spec.ts
//
// E2E + API tests for user registration.
//
// UI: register → confirm email → logged in (teacher and school paths).
// UI: signup form validation (mismatched passwords, short name, no role).
// API: POST /auth/v1/signup — status codes, response body, profile-row defaults.
//
// Confirmation is done via the admin API — simulating the user clicking the
// email link, so the test works regardless of which SMTP provider production uses.

import { test, expect } from '@playwright/test';
import { confirmUser, createConfirmedUser, getProfile, uniqueEmail } from '../helpers/cleanup';

// Signup still sends a confirmation email synchronously, which can be
// slow/throttled — retry to ride out transient send failures.
test.describe.configure({ retries: 2 });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? '';
const PASSWORD = 'Test1234!';

// ─── UI: happy paths ─────────────────────────────────────────────────────────

test('signup → confirm email → logged in (teacher)', async ({ page }) => {
  const email = uniqueEmail('signup');

  await page.goto('/');
  await page.getByRole('button', { name: 'Sign up' }).click();
  await expect(page.getByText('Create a new account')).toBeVisible();

  await page.getByPlaceholder('e.g. Jane').fill('Test');
  await page.getByPlaceholder('e.g. Smith').fill('User');
  await page.getByPlaceholder('your@email.com').fill(email);
  await page.getByPlaceholder('Minimum 8 characters').fill(PASSWORD);
  await page.getByPlaceholder('Repeat password').fill(PASSWORD);
  await page.locator('.role-card', { hasText: 'Teacher' }).click();
  await page.locator('button[type="submit"].gen-btn').click();

  await expect(page.getByText('Confirm your email address')).toBeVisible({ timeout: 30_000 });

  // Simulate the user clicking the confirmation link.
  await confirmUser(email);

  await page.goto('/');
  await page.getByPlaceholder('your@email.com').fill(email);
  await page.getByPlaceholder('Your password').fill(PASSWORD);
  await page.locator('button[type="submit"].gen-btn').click();

  await expect(page.getByRole('button', { name: /get started/i })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: /get started/i }).click();
  await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
});

test('signup → confirm email → logged in (school)', async ({ page }) => {
  const email = uniqueEmail('signup-school');

  await page.goto('/');
  await page.getByRole('button', { name: 'Sign up' }).click();
  await expect(page.getByText('Create a new account')).toBeVisible();

  await page.getByPlaceholder('e.g. Jane').fill('School');
  await page.getByPlaceholder('e.g. Smith').fill('Admin');
  await page.getByPlaceholder('your@email.com').fill(email);
  await page.getByPlaceholder('Minimum 8 characters').fill(PASSWORD);
  await page.getByPlaceholder('Repeat password').fill(PASSWORD);
  await page.locator('.role-card', { hasText: 'School' }).click();
  await page.locator('button[type="submit"].gen-btn').click();

  await expect(page.getByText('Confirm your email address')).toBeVisible({ timeout: 30_000 });

  await confirmUser(email);

  await page.goto('/');
  await page.getByPlaceholder('your@email.com').fill(email);
  await page.getByPlaceholder('Your password').fill(PASSWORD);
  await page.locator('button[type="submit"].gen-btn').click();

  await expect(page.getByRole('button', { name: /get started/i })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: /get started/i }).click();
  await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
});

// ─── UI: signup form validation ───────────────────────────────────────────────

test.describe('UI: signup form validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Sign up' }).click();
    await expect(page.getByText('Create a new account')).toBeVisible();
  });

  test('mismatched passwords → "Passwords do not match."', async ({ page }) => {
    await page.getByPlaceholder('e.g. Jane').fill('Test');
    await page.getByPlaceholder('e.g. Smith').fill('User');
    await page.getByPlaceholder('your@email.com').fill(uniqueEmail('val-mismatch'));
    await page.getByPlaceholder('Minimum 8 characters').fill(PASSWORD);
    await page.getByPlaceholder('Repeat password').fill('Different1!');
    await page.locator('.role-card', { hasText: 'Teacher' }).click();
    await page.locator('button[type="submit"].gen-btn').click();

    await expect(page.getByText('Passwords do not match.')).toBeVisible();
  });

  test('short first name → "First name must be at least 2 characters."', async ({ page }) => {
    await page.getByPlaceholder('e.g. Jane').fill('A');
    await page.getByPlaceholder('e.g. Smith').fill('User');
    await page.getByPlaceholder('your@email.com').fill(uniqueEmail('val-fname'));
    await page.getByPlaceholder('Minimum 8 characters').fill(PASSWORD);
    await page.getByPlaceholder('Repeat password').fill(PASSWORD);
    await page.locator('.role-card', { hasText: 'Teacher' }).click();
    await page.locator('button[type="submit"].gen-btn').click();

    await expect(page.getByText('First name must be at least 2 characters.')).toBeVisible();
  });

  test('short last name → "Last name must be at least 2 characters."', async ({ page }) => {
    await page.getByPlaceholder('e.g. Jane').fill('Test');
    await page.getByPlaceholder('e.g. Smith').fill('B');
    await page.getByPlaceholder('your@email.com').fill(uniqueEmail('val-lname'));
    await page.getByPlaceholder('Minimum 8 characters').fill(PASSWORD);
    await page.getByPlaceholder('Repeat password').fill(PASSWORD);
    await page.locator('.role-card', { hasText: 'Teacher' }).click();
    await page.locator('button[type="submit"].gen-btn').click();

    await expect(page.getByText('Last name must be at least 2 characters.')).toBeVisible();
  });

  test('no role selected → "Please select a role."', async ({ page }) => {
    await page.getByPlaceholder('e.g. Jane').fill('Test');
    await page.getByPlaceholder('e.g. Smith').fill('User');
    await page.getByPlaceholder('your@email.com').fill(uniqueEmail('val-role'));
    await page.getByPlaceholder('Minimum 8 characters').fill(PASSWORD);
    await page.getByPlaceholder('Repeat password').fill(PASSWORD);
    // Intentionally skip role selection
    await page.locator('button[type="submit"].gen-btn').click();

    await expect(page.getByText('Please select a role.')).toBeVisible();
  });
});

// ─── API: POST /auth/v1/signup ────────────────────────────────────────────────

test.describe('API: POST /auth/v1/signup', () => {
  test('valid signup → 200 with user record (unconfirmed)', async ({ request }) => {
    const email = uniqueEmail('api-signup');
    const res = await request.post(`${SUPABASE_URL}/auth/v1/signup`, {
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      data: { email, password: PASSWORD, data: { role: 'teacher', first_name: 'API', last_name: 'Test' } },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    // With email confirmation on, GoTrue may nest the user under `body.user`
    // or return the user object directly at the root — handle both.
    const user = body.user ?? body;
    expect(user.email).toBe(email.toLowerCase());
    expect(user.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(user.email_confirmed_at).toBeFalsy();
  });

  test('on_auth_user_created trigger sets teacher profile role', async ({ request }) => {
    const email = uniqueEmail('api-profile');
    await request.post(`${SUPABASE_URL}/auth/v1/signup`, {
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      data: { email, password: PASSWORD, data: { role: 'teacher', first_name: 'Profile', last_name: 'Check' } },
    });
    const profile = await getProfile(email);
    expect(profile).not.toBeNull();
    expect(profile?.role).toBe('teacher');
  });

  test('on_auth_user_created trigger sets school profile role', async ({ request }) => {
    const email = uniqueEmail('api-school-profile');
    await request.post(`${SUPABASE_URL}/auth/v1/signup`, {
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      data: { email, password: PASSWORD, data: { role: 'school', first_name: 'School', last_name: 'Admin' } },
    });
    const profile = await getProfile(email);
    expect(profile).not.toBeNull();
    expect(profile?.role).toBe('school');
  });

  test('superadmin role in metadata is coerced to teacher by DB trigger', async ({ request }) => {
    const email = uniqueEmail('api-coerce');
    await request.post(`${SUPABASE_URL}/auth/v1/signup`, {
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      data: { email, password: PASSWORD, data: { role: 'superadmin', first_name: 'Sneaky', last_name: 'User' } },
    });
    const profile = await getProfile(email);
    expect(profile?.role).not.toBe('superadmin');
    expect(profile?.role).toBe('teacher');
  });

  test('duplicate (already-registered) email → 200 with empty identities (anti-enumeration)', async ({ request }) => {
    // GoTrue doesn't reject a duplicate signup outright — that would let a
    // caller enumerate registered addresses. It returns the same 200 shape
    // as a fresh signup, but `identities` is empty (no new identity created)
    // instead of containing the new-identity object a fresh signup gets.
    const email = uniqueEmail('api-dup');
    await createConfirmedUser({ email, password: PASSWORD });

    const res = await request.post(`${SUPABASE_URL}/auth/v1/signup`, {
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      data: { email, password: PASSWORD, data: { role: 'teacher', first_name: 'Dup', last_name: 'Signup' } },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.identities).toEqual([]);
  });

  test('password below minimum length → 422', async ({ request }) => {
    const res = await request.post(`${SUPABASE_URL}/auth/v1/signup`, {
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      data: { email: uniqueEmail('api-weak'), password: 'abc', data: { role: 'teacher', first_name: 'Weak', last_name: 'Pass' } },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(422);
  });

  test('missing apikey header → 401', async ({ request }) => {
    const res = await request.post(`${SUPABASE_URL}/auth/v1/signup`, {
      headers: { 'Content-Type': 'application/json' },
      data: { email: uniqueEmail('api-nokey'), password: PASSWORD, data: { role: 'teacher', first_name: 'No', last_name: 'Key' } },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(401);
  });
});
