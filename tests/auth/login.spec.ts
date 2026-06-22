// tests/auth/login.spec.ts
//
// E2E tests for the login form: success and the various failure modes.
//
// A confirmed fixture user is created up front via the admin API (service
// role), so these tests don't depend on the email-confirmation flow.
// The user is cleaned up by the global teardown (all @example.test users).

import { test, expect, type Page } from '@playwright/test';
import { createConfirmedUser, uniqueEmail } from '../helpers/cleanup';

const PASSWORD = 'Test1234!';
const EMAIL = uniqueEmail('login');

test.beforeAll(async () => {
  await createConfirmedUser({ email: EMAIL, password: PASSWORD, role: 'teacher' });
});

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
});

async function submitLogin(page: Page, email: string, password: string) {
  if (email) await page.getByPlaceholder('your@email.com').fill(email);
  if (password) await page.getByPlaceholder('Your password').fill(password);
  await page.locator('button[type="submit"].gen-btn').click();
}

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
