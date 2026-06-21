// tests/auth/logout.spec.ts
//
// E2E tests for signing out.
//
// Uses a confirmed fixture user (created via the admin API). After login the
// app shows the landing page, so we click "Get started" to reach the main app
// where the "Sign out" button lives. Cleanup is handled by the global teardown.

import { test, expect, type Page } from '@playwright/test';
import { createConfirmedUser } from '../helpers/cleanup';

const PASSWORD = 'Test1234!';
const EMAIL = `logout-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;

test.beforeAll(async () => {
  await createConfirmedUser({ email: EMAIL, password: PASSWORD, role: 'teacher' });
});

// Log in and advance past the landing page into the main app.
async function loginToApp(page: Page) {
  await page.goto('/');
  await page.getByPlaceholder('your@email.com').fill(EMAIL);
  await page.getByPlaceholder('Your password').fill(PASSWORD);
  await page.locator('button[type="submit"].gen-btn').click();
  await expect(page.getByRole('button', { name: /get started/i })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: /get started/i }).click();
  await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
}

test('sign out returns to the login screen', async ({ page }) => {
  await loginToApp(page);

  await page.getByRole('button', { name: /sign out/i }).click();

  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByPlaceholder('your@email.com')).toBeVisible();
});

test('sign out clears the session (reload stays logged out)', async ({ page }) => {
  await loginToApp(page);
  await page.getByRole('button', { name: /sign out/i }).click();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible({ timeout: 10_000 });

  // A persisted session would auto-log-in on reload; we should stay logged out.
  await page.reload();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('button', { name: /sign out/i })).toHaveCount(0);
});
