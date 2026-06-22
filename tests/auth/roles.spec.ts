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
import { createConfirmedUser, getProfile, uniqueEmail } from '../helpers/cleanup';
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
