// tests/auth/registration.spec.ts
//
// E2E test: register → confirm email → logged in.
//
// Instead of reading the confirmation email from Mailtrap, confirmation is
// done via the admin API — simulating the user clicking the email link. This
// keeps the test working regardless of which SMTP provider production uses.

import { test, expect } from '@playwright/test';
import { confirmUser, uniqueEmail } from '../helpers/cleanup';

// Signup still sends a confirmation email synchronously, which can be
// slow/throttled — retry to ride out transient send failures.
test.describe.configure({ retries: 2 });

test('signup → confirm email → logged in', async ({ page }) => {
  const email = uniqueEmail('signup');
  const password = 'Test1234!';

  await page.goto('/');

  await page.getByRole('button', { name: 'Sign up' }).click();
  await expect(page.getByText('Create a new account')).toBeVisible();

  await page.getByPlaceholder('e.g. Jane').fill('Test');
  await page.getByPlaceholder('e.g. Smith').fill('User');
  await page.getByPlaceholder('your@email.com').fill(email);
  await page.getByPlaceholder('Minimum 8 characters').fill(password);
  await page.getByPlaceholder('Repeat password').fill(password);
  await page.locator('.role-card', { hasText: 'Teacher' }).click();
  await page.locator('button[type="submit"].gen-btn').click();

  await expect(page.getByText('Confirm your email address')).toBeVisible({ timeout: 30_000 });

  // Simulate the user clicking the confirmation link.
  await confirmUser(email);

  await page.goto('/');
  await page.getByPlaceholder('your@email.com').fill(email);
  await page.getByPlaceholder('Your password').fill(password);
  await page.locator('button[type="submit"].gen-btn').click();

  await expect(page.getByRole('button', { name: /get started/i })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: /get started/i }).click();
  await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
});
