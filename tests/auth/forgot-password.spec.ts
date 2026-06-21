// tests/auth/forgot-password.spec.ts
//
// E2E tests for the "Forgot password?" flow on the auth screen.
//
// Note: supabase.auth.resetPasswordForEmail() returns success regardless of
// whether the address exists (anti-enumeration), so the success case needs no
// fixture user. We assert the UI flow only and don't read Mailtrap here, to
// avoid mailbox contention with the registration spec under parallel runs.

import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // Switch from the login view to the forgot-password view.
  await page.getByRole('button', { name: /forgot password\?/i }).click();
  await expect(page.getByText('Reset your password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send reset link' })).toBeVisible();
});

test('valid email → "Check your email" confirmation', async ({ page }) => {
  const email = `reset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
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
  // Still on the reset form — submission was blocked client-side.
  await expect(page.getByRole('button', { name: 'Send reset link' })).toBeVisible();
});

test('"Back to sign in" returns to the login form', async ({ page }) => {
  await page.getByRole('button', { name: /back to sign in/i }).click();

  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  await expect(page.getByText('Welcome! Sign in to continue.')).toBeVisible();
});
