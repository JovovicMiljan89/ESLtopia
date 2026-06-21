// tests/auth/password-reset.spec.ts
//
// E2E tests for completing a password reset: following the recovery link,
// setting a new password on the "Set a new password" screen, and confirming
// the new password works (and the old one no longer does).
//
// The recovery link is generated via the admin API (generateLink) instead of
// reading the email from Mailtrap — this is race-free under parallel runs and
// doesn't depend on inbox state. Each test uses its own user to stay isolated.
// Users are removed by the global teardown.

import { test, expect, type Page } from '@playwright/test';
import { createConfirmedUser, generateRecoveryLink } from '../helpers/cleanup';

const OLD_PASSWORD = 'OldPass123!';
const NEW_PASSWORD = 'NewPass456!';
const BASE_URL = process.env.BASE_URL ?? 'https://esltopia.vercel.app';

function uniqueEmail(tag: string): string {
  return `reset-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
}

// Create a confirmed user and land the browser on the "Set a new password" screen.
async function startRecovery(page: Page, email: string): Promise<void> {
  await createConfirmedUser({ email, password: OLD_PASSWORD, role: 'teacher' });
  const link = await generateRecoveryLink(email, BASE_URL);
  await page.goto(link);
  await expect(page.getByText('Set a new password')).toBeVisible({ timeout: 15_000 });
}

test('set a new password, then log in with it (old one stops working)', async ({ page }) => {
  const email = uniqueEmail('done');
  await startRecovery(page, email);

  // Set the new password.
  await page.getByPlaceholder('Minimum 8 characters').fill(NEW_PASSWORD);
  await page.getByPlaceholder('Repeat password').fill(NEW_PASSWORD);
  await page.getByRole('button', { name: 'Set new password' }).click();
  await expect(page.getByText('Password updated!')).toBeVisible({ timeout: 15_000 });

  // App signs out and returns to the login screen after a short delay.
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible({ timeout: 15_000 });

  // The old password is rejected.
  await page.getByPlaceholder('your@email.com').fill(email);
  await page.getByPlaceholder('Your password').fill(OLD_PASSWORD);
  await page.locator('button[type="submit"].gen-btn').click();
  await expect(page.getByText('Incorrect email or password.')).toBeVisible({ timeout: 15_000 });

  // The new password logs in successfully.
  await page.getByPlaceholder('your@email.com').fill(email);
  await page.getByPlaceholder('Your password').fill(NEW_PASSWORD);
  await page.locator('button[type="submit"].gen-btn').click();
  await expect(page.getByRole('button', { name: /get started/i })).toBeVisible({ timeout: 15_000 });
});

test('mismatched passwords → "Passwords do not match."', async ({ page }) => {
  await startRecovery(page, uniqueEmail('mismatch'));

  await page.getByPlaceholder('Minimum 8 characters').fill(NEW_PASSWORD);
  await page.getByPlaceholder('Repeat password').fill('Different123!');
  await page.getByRole('button', { name: 'Set new password' }).click();

  await expect(page.getByText('Passwords do not match.')).toBeVisible();
  // Still on the reset screen — not submitted.
  await expect(page.getByText('Set a new password')).toBeVisible();
});

test('weak password → validation error', async ({ page }) => {
  await startRecovery(page, uniqueEmail('weak'));

  await page.getByPlaceholder('Minimum 8 characters').fill('weak');
  await page.getByPlaceholder('Repeat password').fill('weak');
  await page.getByRole('button', { name: 'Set new password' }).click();

  await expect(page.getByText('Password must be at least 8 characters.')).toBeVisible();
});
