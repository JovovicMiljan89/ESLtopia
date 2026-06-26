// tests/auth/navigation.spec.ts
//
// Session-persistence and auth-guard tests.
//
// Verifies that:
//   * An unauthenticated visit shows the login form, not the app
//   * A valid session is restored across a page reload (Supabase localStorage)
//   * A session belonging to a deactivated account is signed out on reload
//     (the app calls signOut when getSession returns a pending/inactive profile)

import { test, expect } from '@playwright/test';
import { createConfirmedUser, getProfile, setProfileStatus, uniqueEmail } from '../helpers/cleanup';
import { loginToApp } from '../helpers/ui';

const PASSWORD = 'Test1234!';
const EMAIL = uniqueEmail('nav');

test.beforeAll(async () => {
  await createConfirmedUser({ email: EMAIL, password: PASSWORD, role: 'teacher' });
});

test('unauthenticated visit → login form is shown, not the app', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  await expect(page.getByRole('button', { name: /sign out/i })).toHaveCount(0);
});

test('authenticated session persists across page reload', async ({ page }) => {
  await loginToApp(page, EMAIL, PASSWORD);

  await page.reload();

  // After reload Supabase restores the session from localStorage and the app
  // shows the "Get started" landing rather than the login form.
  await expect(page.getByRole('button', { name: /get started/i })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: 'Sign in' })).toHaveCount(0);
});

test('lingering session for a deactivated account is signed out on reload', async ({ page }) => {
  const deactivatedEmail = uniqueEmail('nav-deactivated');
  await createConfirmedUser({ email: deactivatedEmail, password: PASSWORD, role: 'teacher' });

  await loginToApp(page, deactivatedEmail, PASSWORD);
  await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();

  // Deactivate the account server-side while the session is still live.
  // getProfile() polls until the row exists so setProfileStatus() isn't a no-op.
  await getProfile(deactivatedEmail);
  await setProfileStatus(deactivatedEmail, 'inactive');

  // On reload the app calls getSession(), fetches the profile, detects
  // status === 'inactive', calls signOut(), and shows the login form.
  await page.reload();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: /sign out/i })).toHaveCount(0);
});
