// tests/auth/registration.spec.ts
//
// E2E test: register → (confirm email) → logged in.
//
// Provider-independent: instead of reading the confirmation email out of an
// inbox (which only works while SMTP points at Mailtrap), it confirms the new
// user via the admin API — simulating the user clicking the email link. This
// keeps the test working regardless of which SMTP provider production uses.

import { test, expect } from '@playwright/test';
import { confirmUser } from '../helpers/cleanup';

// Signup still sends a confirmation email synchronously via SMTP, which can be
// slow/throttled — retry to ride out transient send failures.
test.describe.configure({ retries: 2 });

test('signup → confirm email → logged in', async ({ page }) => {
  const email = `signup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
  const password = 'Test1234!';

  // ── 1. Open app — auth screen shows by default ─────────────────────────────
  await page.goto('/');

  // ── 2. Switch to the sign-up form ──────────────────────────────────────────
  await page.getByRole('button', { name: 'Sign up' }).click();
  await expect(page.getByText('Create a new account')).toBeVisible();

  // ── 3. Fill in the registration form ───────────────────────────────────────
  await page.getByPlaceholder('e.g. Jane').fill('Test');
  await page.getByPlaceholder('e.g. Smith').fill('User');
  await page.getByPlaceholder('your@email.com').fill(email);
  await page.getByPlaceholder('Minimum 8 characters').fill(password);
  await page.getByPlaceholder('Repeat password').fill(password);

  // ── 4. Select Teacher role ─────────────────────────────────────────────────
  await page.locator('.role-card', { hasText: 'Teacher' }).click();

  // ── 5. Submit ──────────────────────────────────────────────────────────────
  await page.locator('button[type="submit"].gen-btn').click();

  // ── 6. App shows the "confirm your email" screen ───────────────────────────
  await expect(page.getByText('Confirm your email address')).toBeVisible({ timeout: 30_000 });

  // ── 7. Simulate the user clicking the confirmation link ────────────────────
  await confirmUser(email);

  // ── 8. Log in with the now-confirmed account ───────────────────────────────
  await page.goto('/');
  await page.getByPlaceholder('your@email.com').fill(email);
  await page.getByPlaceholder('Your password').fill(password);
  await page.locator('button[type="submit"].gen-btn').click();

  // ── 9. Landing page shows after first login — click "Get started" ──────────
  await expect(page.getByRole('button', { name: /get started/i })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: /get started/i }).click();

  // ── 10. Confirm the user is logged in ──────────────────────────────────────
  await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
});
