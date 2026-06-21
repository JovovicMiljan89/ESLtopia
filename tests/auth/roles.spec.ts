// tests/auth/roles.spec.ts
//
// Role-based access tests.
//
//   * Users must not be able to register as superadmin — the signup UI offers
//     only Teacher and School, and the backend coerces any other role.
//   * Teachers must not be able to reach the Admin portal.
//
// Fixture users are created via the admin API and removed by the global teardown.

import { test, expect, type Page } from '@playwright/test';
import { createConfirmedUser, getProfileRole } from '../helpers/cleanup';

const PASSWORD = 'Test1234!';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? '';

function uniqueEmail(tag: string): string {
  return `role-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
}

// Log in as the given fixture user and advance into the main app.
async function loginToApp(page: Page, email: string) {
  await page.goto('/');
  await page.getByPlaceholder('your@email.com').fill(email);
  await page.getByPlaceholder('Your password').fill(PASSWORD);
  await page.locator('button[type="submit"].gen-btn').click();
  await expect(page.getByRole('button', { name: /get started/i })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: /get started/i }).click();
  // Confirm we're in the app shell.
  await expect(page.getByRole('button', { name: /generator/i })).toBeVisible({ timeout: 15_000 });
}

test.describe('superadmin registration is not possible', () => {
  test('signup form offers only Teacher and School roles', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Sign up' }).click();
    await expect(page.getByText('Create a new account')).toBeVisible();

    const roleCards = page.locator('.role-card');
    await expect(roleCards).toHaveCount(2);
    await expect(roleCards.filter({ hasText: 'Teacher' })).toBeVisible();
    await expect(roleCards.filter({ hasText: 'School' })).toBeVisible();
    // No superadmin option anywhere in the form.
    await expect(page.getByText('Super Admin')).toHaveCount(0);
    await expect(page.locator('.role-card', { hasText: /super ?admin/i })).toHaveCount(0);
  });

  test('a superadmin signup attempt is coerced to a non-privileged role', async ({ request }) => {
    // Attempt to self-register as superadmin directly against the signup API,
    // bypassing the UI (which doesn't even offer the option).
    const email = uniqueEmail('superadmin-attempt');
    const res = await request.post(`${SUPABASE_URL}/auth/v1/signup`, {
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      data: {
        email,
        password: PASSWORD,
        data: { role: 'superadmin', first_name: 'Sneaky', last_name: 'User' },
      },
    });
    expect(res.ok()).toBeTruthy();

    // The DB trigger must have rejected the privileged role.
    const role = await getProfileRole(email);
    expect(role).not.toBe('superadmin');
    expect(role).toBe('teacher');
  });
});

test.describe('admin portal access', () => {
  const teacherEmail = uniqueEmail('teacher');

  test.beforeAll(async () => {
    await createConfirmedUser({ email: teacherEmail, password: PASSWORD, role: 'teacher' });
  });

  test('teacher cannot see or open the admin portal', async ({ page }) => {
    await loginToApp(page, teacherEmail);
    // No Admin tab is rendered for teachers.
    await expect(page.locator('button.tab', { hasText: 'Admin' })).toHaveCount(0);
    // Sanity: the regular tabs are present.
    await expect(page.locator('button.tab', { hasText: 'Classes' })).toBeVisible();
  });
});
