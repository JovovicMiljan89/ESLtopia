// tests/visual/visual-regression.spec.ts
//
// Pixel-diff regression tests on the app's key screens, using Playwright's
// toHaveScreenshot(). The first run creates baseline PNGs under
// visual-regression.spec.ts-snapshots/; every later run compares against
// them and fails on unexpected UI drift.
//
// Baselines must be generated on the same ubuntu-24.04 runner CI uses, NOT
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
// is picked (see EnglishGenerator.jsx), so every flow below selects a grade
// before touching a topic card. The "am / is / are" fixture topic moved from
// Grade 2 to Grade 4 (renamed "Am/is/are") as part of the grade-1-4
// curriculum regroup in worksheetContent.js, which also changed every grade's
// topic-grid contents (many new "comingSoon" placeholder cards) — baselines
// need regenerating via the workflow above before this file will pass again,
// this fix only gets the tests interacting with the right elements.

import { type Page } from '@playwright/test';
import { test, expect } from '../helpers/fixtures';
import { createConfirmedUser, uniqueEmail } from '../helpers/cleanup';
import { loginToApp } from '../helpers/ui';

const PASSWORD = 'Test1234!';

test.describe.configure({ mode: 'serial' });
test.use({ viewport: { width: 1280, height: 900 } });

// A small tolerance absorbs the residual anti-aliasing noise that can differ
// even between identical Docker images run on different host CPUs.
const SCREENSHOT_OPTS = { maxDiffPixelRatio: 0.02 } as const;

// Worksheet content is drawn with Math.random() (shuffle() in
// WorksheetTasks.jsx), so every generated worksheet has different sentences
// in a different order. Unseeded, the PDF modal differed from its baseline by
// a random amount that sometimes crossed maxDiffPixelRatio -- a flake, not a
// regression. Call this right before generating so the content is identical
// on every run. Changing the seed (or the generator) needs new baselines.
async function seedRandom(page: Page): Promise<void> {
  await page.evaluate(() => {
    let state = 0x2f6e2b1;
    // mulberry32
    Math.random = () => {
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  });
}

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
  await page.getByRole('button', { name: /^Grade 4/ }).click();
  await page.locator('.topic-card', { hasText: 'Am/is/are' }).click();
  await expect(page.locator('.topic-card.active')).toBeVisible();
  await expect(page.locator('.app')).toHaveScreenshot('worksheet-generator.png', SCREENSHOT_OPTS);
});

test('PDF preview modal', async ({ page }) => {
  await freshDashboard(page);
  await page.getByRole('button', { name: /^Grade 4/ }).click();
  await page.locator('.topic-card', { hasText: 'Am/is/are' }).click();
  await seedRandom(page);
  await page.getByRole('button', { name: /generate worksheet/i }).click();
  await expect(page.locator('.pdf-modal-card')).toBeVisible();
  await expect(page.locator('.pdf-modal-card')).toHaveScreenshot('pdf-modal.png', SCREENSHOT_OPTS);
});
