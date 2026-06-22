// tests/auth/forgot-password.spec.ts
//
// E2E tests for the "Forgot password?" flow on the auth screen.
//
// supabase.auth.resetPasswordForEmail() returns success regardless of whether
// the address exists (anti-enumeration), so the success case needs no fixture
// user. We assert the UI flow only and don't read Mailtrap here, to avoid
// mailbox contention with the registration spec under parallel runs.

import { test, expect } from '@playwright/test';
import { uniqueEmail } from '../helpers/cleanup';

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
