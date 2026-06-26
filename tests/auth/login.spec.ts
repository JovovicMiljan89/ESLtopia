// tests/auth/login.spec.ts
//
// E2E + API tests for login: form validation, UI flows, and the
// password-grant endpoint directly.
//
// A confirmed fixture user is created up front via the admin API (service
// role), so these tests don't depend on the email-confirmation flow.
// Users are cleaned up by the global teardown (all @example.test users).

import { test, expect, type Page } from '@playwright/test';
import { createConfirmedUser, uniqueEmail } from '../helpers/cleanup';

const PASSWORD = 'Test1234!';
const EMAIL = uniqueEmail('login');
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? '';

test.beforeAll(async () => {
  await createConfirmedUser({ email: EMAIL, password: PASSWORD, role: 'teacher' });
});

async function submitLogin(page: Page, email: string, password: string) {
  if (email) await page.getByPlaceholder('your@email.com').fill(email);
  if (password) await page.getByPlaceholder('Your password').fill(password);
  await page.locator('button[type="submit"].gen-btn').click();
}

// ─── UI ───────────────────────────────────────────────────────────────────────

test.describe('UI: login form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('valid credentials → logged in', async ({ page }) => {
    await submitLogin(page, EMAIL, PASSWORD);
    await expect(page.getByRole('button', { name: /get started/i })).toBeVisible({ timeout: 15_000 });
  });

  test('wrong password → "Incorrect email or password."', async ({ page }) => {
    await submitLogin(page, EMAIL, 'WrongPassword123!');
    await expect(page.getByText('Incorrect email or password.')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('unregistered email → "Incorrect email or password."', async ({ page }) => {
    await submitLogin(page, uniqueEmail('nobody'), PASSWORD);
    await expect(page.getByText('Incorrect email or password.')).toBeVisible({ timeout: 15_000 });
  });

  test('invalid email format → validation error, no request sent', async ({ page }) => {
    await submitLogin(page, 'notanemail', PASSWORD);
    await expect(page.getByText('Please enter a valid email address.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('empty password → validation error', async ({ page }) => {
    await submitLogin(page, EMAIL, '');
    await expect(page.getByText('Please enter your password.')).toBeVisible();
  });

  test('empty email → validation error', async ({ page }) => {
    await submitLogin(page, '', PASSWORD);
    await expect(page.getByText('Please enter a valid email address.')).toBeVisible();
  });
});

// ─── API ──────────────────────────────────────────────────────────────────────

test.describe('API: POST /auth/v1/token (password grant)', () => {
  test('valid credentials → 200 with access_token and refresh_token', async ({ request }) => {
    const res = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      data: { email: EMAIL, password: PASSWORD },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.access_token).toBeTruthy();
    expect(body.refresh_token).toBeTruthy();
    expect(body.token_type).toBe('bearer');
    expect(body.expires_in).toBeGreaterThan(0);
  });

  test('response body includes confirmed user object', async ({ request }) => {
    const res = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      data: { email: EMAIL, password: PASSWORD },
    });
    const body = await res.json();
    expect(body.user.email).toBe(EMAIL.toLowerCase());
    expect(body.user.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(body.user.email_confirmed_at).toBeTruthy();
  });

  test('access_token is a well-formed JWT (header.payload.signature)', async ({ request }) => {
    const res = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      data: { email: EMAIL, password: PASSWORD },
    });
    const { access_token } = await res.json();
    expect(access_token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
  });

  test('wrong password → 400', async ({ request }) => {
    const res = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      data: { email: EMAIL, password: 'WrongPassword123!' },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    // GoTrue v1 uses `error`, v2 uses `error_code` or `msg`
    expect(body.error ?? body.error_code ?? body.msg).toBeTruthy();
  });

  test('unregistered email → 400', async ({ request }) => {
    const res = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      data: { email: uniqueEmail('api-nobody'), password: PASSWORD },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(400);
  });

  test('missing apikey header → 401', async ({ request }) => {
    const res = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      headers: { 'Content-Type': 'application/json' },
      data: { email: EMAIL, password: PASSWORD },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(401);
  });
});

// ─── Unconfirmed user ─────────────────────────────────────────────────────────

test('unconfirmed user cannot log in', async ({ page, request }) => {
  const email = uniqueEmail('unconfirmed');
  // Sign up via the public API — email confirmation is required, so the user is
  // created but cannot log in until the confirmation link is clicked.
  await request.post(`${SUPABASE_URL}/auth/v1/signup`, {
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    data: { email, password: PASSWORD, data: { role: 'teacher', first_name: 'Unconfirmed', last_name: 'User' } },
  });

  await page.goto('/');
  await page.getByPlaceholder('your@email.com').fill(email);
  await page.getByPlaceholder('Your password').fill(PASSWORD);
  await page.locator('button[type="submit"].gen-btn').click();

  // The app maps all auth errors (including "Email not confirmed") to this message.
  await expect(page.getByText('Incorrect email or password.')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
});

// ─── API: token refresh ───────────────────────────────────────────────────────

test.describe('API: POST /auth/v1/token (refresh_token grant)', () => {
  test('valid refresh_token → new access_token and refresh_token', async ({ request }) => {
    const loginRes = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      data: { email: EMAIL, password: PASSWORD },
    });
    const { refresh_token } = await loginRes.json();

    const res = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      data: { refresh_token },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.access_token).toBeTruthy();
    expect(body.refresh_token).toBeTruthy();
    expect(body.token_type).toBe('bearer');
  });

  test('invalid refresh_token → 400', async ({ request }) => {
    const res = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      data: { refresh_token: 'not-a-real-refresh-token' },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(400);
  });

  test('refresh_token is invalidated after logout', async ({ request }) => {
    const loginRes = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      data: { email: EMAIL, password: PASSWORD },
    });
    const { access_token, refresh_token } = await loginRes.json();

    await request.post(`${SUPABASE_URL}/auth/v1/logout`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${access_token}` },
      failOnStatusCode: false,
    });

    const res = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      data: { refresh_token },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(400);
  });
});
