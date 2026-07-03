// tests/app/pdf-modal.spec.ts
//
// UI tests for the PDF preview modal (src/PdfPreviewModal.jsx), opened from the
// worksheet generator. Redesigned in commit dc30d0f (light card-style header +
// action bar).
//
// "am / is / are" is used as the fixture topic because its generator always
// returns type "fillin" (no supportedTypes branching), so the rendered markup
// is deterministic across runs. `.pdf-a4-page` scopes assertions to the modal's
// copy of the worksheet — the same task component also renders in the
// background `.worksheet-wrap`, which stays mounted (just visually covered)
// while the modal is open.

import { test, expect } from '@playwright/test';
import { createConfirmedUser, uniqueEmail } from '../helpers/cleanup';
import { loginToApp } from '../helpers/ui';

const PASSWORD = 'Test1234!';
const teacherEmail = uniqueEmail('pdf-modal');

test.beforeAll(async () => {
  await createConfirmedUser({ email: teacherEmail, password: PASSWORD, role: 'teacher' });
});

async function openGeneratedWorksheet(page: import('@playwright/test').Page) {
  await loginToApp(page, teacherEmail, PASSWORD);
  await page.locator('.topic-card', { hasText: 'am / is / are' }).click();
  await page.getByRole('button', { name: /generate worksheet/i }).click();
  await expect(page.locator('.pdf-modal-card')).toBeVisible();
}

test.describe('PDF preview modal', () => {
  test('generating a worksheet opens the modal with topic and grade info', async ({ page }) => {
    await openGeneratedWorksheet(page);
    await expect(page.locator('.pdf-modal-title')).toHaveText('am / is / are');
    await expect(page.locator('.pdf-modal-subtitle')).toContainText('Grade 2');
    await expect(page.locator('.pdf-modal-subtitle')).toContainText('exercises');
  });

  test('toggling the answer key switch shows and hides answers', async ({ page }) => {
    await openGeneratedWorksheet(page);
    const toggle = page.locator('.pdf-answer-toggle');
    const answers = page.locator('.pdf-a4-page .fill-blank-answer');
    const answerKey = page.locator('.pdf-a4-page .answer-key');

    await expect(answers).toHaveCount(0);
    await expect(answerKey).not.toBeVisible();

    await toggle.click();
    await expect(toggle).toHaveClass(/active/);
    await expect(answerKey).toBeVisible();
    expect(await answers.count()).toBeGreaterThan(0);

    await toggle.click();
    await expect(toggle).not.toHaveClass(/active/);
    await expect(answers).toHaveCount(0);
  });

  test('"New set" regenerates the worksheet without closing the modal', async ({ page }) => {
    await openGeneratedWorksheet(page);
    const fillItems = page.locator('.pdf-a4-page .fill-item');
    const initialCount = await fillItems.count();

    await page.locator('.pdf-modal-card').getByRole('button', { name: /new set/i }).click();

    await expect(page.locator('.pdf-modal-card')).toBeVisible();
    await expect(fillItems).toHaveCount(initialCount);
  });

  test('close button hides the modal', async ({ page }) => {
    await openGeneratedWorksheet(page);
    await page.locator('.pdf-modal-close').click();
    await expect(page.locator('.pdf-modal-card')).toHaveCount(0);
  });

  test('Escape key hides the modal', async ({ page }) => {
    await openGeneratedWorksheet(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('.pdf-modal-card')).toHaveCount(0);
  });
});
