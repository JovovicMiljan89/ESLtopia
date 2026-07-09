// tests/visual/visual-regression.spec.ts
//
// Pixel-diff regression tests on the app's key screens, using Playwright's
// toHaveScreenshot(). The first run creates baseline PNGs under
// visual-regression.spec.ts-snapshots/; every later run compares against
// them and fails on unexpected UI drift.
//
// Baselines must be generated on the same ubuntu-latest runner CI uses, NOT
// on a local dev machine — font rendering differs enough between OSes to
// make cross-platform screenshots useless. To (re)generate baselines after
// an intentional UI change, run the "Update Visual Regression Baselines"
// GitHub Actions workflow (workflow_dispatch) and commit the downloaded
// "visual-baselines" artifact over this directory's *-snapshots/ folder.
//
// Fixed firstName/lastName keep the header's name/avatar deterministic even
// though the email itself is randomized per run (uniqueEmail).
//
// The generator's grade-picker UI means topic cards only render once a grade
// is picked (see EnglishGenerator.jsx), so every flow below selects Grade 2
// before touching a topic card. That grade-picker + the multi-section
// worksheet layout are both intentional UI changes the current baselines
// predate — they need regenerating via the workflow above before this file
// will pass again, this fix only gets the tests interacting with the right
// elements.

import { test, expect, type Page } from '@playwright/test';
import { createConfirmedUser, uniqueEmail } from '../helpers/cleanup';
import { loginToApp } from '../helpers/ui';

const PASSWORD = 'Test1234!';

test.describe.configure({ mode: 'serial' });
test.use({ viewport: { width: 1280, height: 900 } });

// A small tolerance absorbs the residual anti-aliasing noise that can differ
// even between identical Docker images run on different host CPUs.
const SCREENSHOT_OPTS = { maxDiffPixelRatio: 0.02 } as const;

async function freshDashboard(page: Page): Promise<void> {
  const email = uniqueEmail('visual-dashboard');
  await createConfirmedUser({ email, password: PASSWORD, role: 'teacher', firstName: 'Visual', lastName: 'Regression' });
  await loginToApp(page, email, PASSWORD);
}

test('login screen', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.auth-card')).toBeVisible();
  await expect(page.locator('.auth-card')).toHaveScreenshot('login.png', SCREENSHOT_OPTS);
});

test('dashboard (generator tab, no topic selected)', async ({ page }) => {
  await freshDashboard(page);
  await expect(page.locator('.app')).toHaveScreenshot('dashboard.png', SCREENSHOT_OPTS);
});

test('worksheet generator settings (topic selected)', async ({ page }) => {
  await freshDashboard(page);
  await page.getByRole('button', { name: /^Grade 2/ }).click();
  await page.locator('.topic-card', { hasText: 'am / is / are' }).click();
  await expect(page.locator('.topic-card.active')).toBeVisible();
  await expect(page.locator('.app')).toHaveScreenshot('worksheet-generator.png', SCREENSHOT_OPTS);
});

test('PDF preview modal', async ({ page }) => {
  await freshDashboard(page);
  await page.getByRole('button', { name: /^Grade 2/ }).click();
  await page.locator('.topic-card', { hasText: 'am / is / are' }).click();
  await page.getByRole('button', { name: /generate worksheet/i }).click();
  await expect(page.locator('.pdf-modal-card')).toBeVisible();
  await expect(page.locator('.pdf-modal-card')).toHaveScreenshot('pdf-modal.png', SCREENSHOT_OPTS);
});
