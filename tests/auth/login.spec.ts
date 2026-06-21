// tests/auth/login.spec.ts
//
// E2E tests for the login form: success and the various failure modes.
//
// A confirmed fixture user is created up front via the admin API (service
// role), so these tests don't depend on the email-confirmation flow.
// The user is cleaned up by the global teardown (all @example.test users).

import { test, expect } from '@playwright/test';
import { createConfirmedUser } from '../helpers/cleanup';

const PASSWORD = 'Test1234!';
// Unique per run, @example.test so the global teardown purges it.
const EMAIL = `login-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;

test.beforeAll(async () => {
  await createConfirmedUser({ email: EMAIL, password: PASSWORD, role: 'teacher' });
});

test.beforeEach(async ({ page }) => {
  // The auth screen opens on the login view by default.
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
});

async function submitLogin(page, email: string, password: string) {
  if (email) await page.getByPlaceholder('your@email.com').fill(email);
  if (password) await page.getByPlaceholder('Your password').fill(password);
  await page.locator('button[type="submit"].gen-btn').click();
}

test('valid credentials → logged in', async ({ page }) => {
  await submitLogin(page, EMAIL, PASSWORD);
  // A successful login lands on the post-login landing page.
  await expect(page.getByRole('button', { name: /get started/i })).toBeVisible({ timeout: 15_000 });
});

test('wrong password → "Incorrect email or password."', async ({ page }) => {
  await submitLogin(page, EMAIL, 'WrongPassword123!');
  await expect(page.getByText('Incorrect email or password.')).toBeVisible({ timeout: 15_000 });
  // Still on the login form — not authenticated.
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
});

test('unregistered email → "Incorrect email or password."', async ({ page }) => {
  await submitLogin(page, `nobody-${Date.now()}@example.test`, PASSWORD);
  await expect(page.getByText('Incorrect email or password.')).toBeVisible({ timeout: 15_000 });
});

test('invalid email format → validation error, no request sent', async ({ page }) => {
  await submitLogin(page, 'notanemail', PASSWORD);
  await expect(page.getByText('Please enter a valid email address.')).toBeVisible();
  // Client-side validation blocks submission — still on the login form.
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
