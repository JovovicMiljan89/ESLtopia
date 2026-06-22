// tests/helpers/ui.ts
//
// Shared Playwright page-level helpers reused across auth specs.

import { expect, type Page } from '@playwright/test';

/**
 * Log in with the given credentials and advance past the landing page into the
 * main app. Assumes the browser is not already authenticated.
 */
export async function loginToApp(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/');
  await page.getByPlaceholder('your@email.com').fill(email);
  await page.getByPlaceholder('Your password').fill(password);
  await page.locator('button[type="submit"].gen-btn').click();
  await expect(page.getByRole('button', { name: /get started/i })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: /get started/i }).click();
}
