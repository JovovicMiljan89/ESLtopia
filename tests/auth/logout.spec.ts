// tests/auth/logout.spec.ts
//
// E2E tests for signing out.
//
// Uses a confirmed fixture user (created via the admin API). After login the
// app shows the landing page, so we click "Get started" to reach the main app
// where the "Sign out" button lives. Cleanup is handled by the global teardown.

import { test, expect } from '@playwright/test';
import { createConfirmedUser, uniqueEmail } from '../helpers/cleanup';
import { loginToApp } from '../helpers/ui';

const PASSWORD = 'Test1234!';
const EMAIL = uniqueEmail('logout');

test.beforeAll(async () => {
  await createConfirmedUser({ email: EMAIL, password: PASSWORD, role: 'teacher' });
});

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
