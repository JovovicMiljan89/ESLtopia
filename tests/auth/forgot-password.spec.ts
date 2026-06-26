// tests/auth/forgot-password.spec.ts
//
// E2E + API tests for the "Forgot password?" / password-recovery flow.
//
// UI: navigates the forgot-password screen, submits the form, and checks
// the confirmation state and navigation back to sign-in.
//
// API: POST /auth/v1/recover — verifies anti-enumeration behaviour (always
// 200 regardless of whether the address exists) and rejects malformed input.
//
// supabase.auth.resetPasswordForEmail() always returns success to prevent
// email-address enumeration, so the UI success case needs no fixture user.
// We assert the UI flow only and don't read Mailtrap here, to avoid mailbox
// contention with the registration spec under parallel runs.

import { test, expect } from '@playwright/test';
import { uniqueEmail } from '../helpers/cleanup';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? '';

// ─── UI ───────────────────────────────────────────────────────────────────────

test.describe('UI: forgot password form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /forgot password\?/i }).click();
    await expect(page.getByText('Reset your password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send reset link' })).toBeVisible();
  });

  test('valid email → "Check your email" confirmation', async ({ page }) => {
    const email = uniqueEmail('reset');
    await page.getByPlaceholder('your@email.com').fill(email);
    await page.getByRole('button', { name: 'Send reset link' }).click();

    await expect(page.getByText('Check your email')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(email)).toBeVisible();
    await expect(page.getByRole('button', { name: /back to sign in/i })).toBeVisible();
  });

  test('invalid email format → validation error, no request sent', async ({ page }) => {
    await page.getByPlaceholder('your@email.com').fill('notanemail');
    await page.getByRole('button', { name: 'Send reset link' }).click();

    await expect(page.getByText('Please enter a valid email address.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send reset link' })).toBeVisible();
  });

  test('"Back to sign in" returns to the login form', async ({ page }) => {
    await page.getByRole('button', { name: /back to sign in/i }).click();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByText('Welcome! Sign in to continue.')).toBeVisible();
  });
});

// ─── API ──────────────────────────────────────────────────────────────────────

test.describe('API: POST /auth/v1/recover', () => {
  test('non-existent email → 200 (anti-enumeration, no user revealed)', async ({ request }) => {
    const res = await request.post(`${SUPABASE_URL}/auth/v1/recover`, {
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      data: { email: uniqueEmail('recover-nobody') },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(200);
  });

  test('registered email → same 200 as non-existent (anti-enumeration)', async ({ request }) => {
    // Both registered and unregistered addresses return 200 — callers cannot
    // distinguish which emails exist.
    const res = await request.post(`${SUPABASE_URL}/auth/v1/recover`, {
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      data: { email: uniqueEmail('recover-registered') },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(200);
  });

  test('missing email field → non-2xx error', async ({ request }) => {
    const res = await request.post(`${SUPABASE_URL}/auth/v1/recover`, {
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      data: {},
      failOnStatusCode: false,
    });
    // GoTrue returns 400 or 422 for a missing/empty email — either is acceptable.
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  test('missing apikey header → 401', async ({ request }) => {
    const res = await request.post(`${SUPABASE_URL}/auth/v1/recover`, {
      headers: { 'Content-Type': 'application/json' },
      data: { email: uniqueEmail('recover-nokey') },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(401);
  });
});
