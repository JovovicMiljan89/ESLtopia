// tests/app/classes-ui.spec.ts
//
// UI click-through tests for the Classes tab. classes.spec.ts already covers
// create/rename/delete/roster CRUD at the REST layer (CLS-01–09), but no test
// clicked the actual "add class" form, roster inputs, or delete button before
// this file — closes the "Classes tab UI click-through" gap in
// docs/qa/test-coverage-todo.md.
//
// Also covers XSS/HTML-injection resilience in the class-name and
// student-name free-text fields: React escapes rendered text by default, but
// nothing previously verified that explicitly (see the same todo doc).
//
// Each test creates its own class rather than sharing one across the describe
// block, because the suite runs fullyParallel and shared mutable fixtures
// would race — same convention as tests/app/records.spec.ts.

import { test, expect, type Page } from '@playwright/test';
import { createConfirmedUser, getAccessToken, getProfile, uniqueEmail } from '../helpers/cleanup';
import { loginToApp } from '../helpers/ui';

const PASSWORD = 'Test1234!';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? '';

function uniqueClassId() {
  return `c_test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function uniqueClassName(label: string) {
  return `${label} ${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

async function createTestClass(token: string, ownerId: string, name: string, students: string[] = []): Promise<string> {
  const id = uniqueClassId();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/classes`, {
    method: 'POST',
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ id, name, owner_id: ownerId, students }),
  });
  if (!res.ok) throw new Error(`createTestClass failed: HTTP ${res.status}`);
  return id;
}

async function openClassesTab(page: Page) {
  await page.locator('button.tab', { hasText: 'Classes' }).click();
}

test.describe('Classes tab: UI click-through', () => {
  const teacherEmail = uniqueEmail('classes-ui');
  let teacherId: string;
  let token: string;

  test.beforeAll(async () => {
    await createConfirmedUser({ email: teacherEmail, password: PASSWORD, role: 'teacher' });
    const profile = await getProfile(teacherEmail);
    teacherId = profile!.id;
    token = await getAccessToken(teacherEmail, PASSWORD);
  });

  test('creating a class via the "add class" form adds it to the list', async ({ page }) => {
    const className = uniqueClassName('Add class');

    await loginToApp(page, teacherEmail, PASSWORD);
    await openClassesTab(page);

    await page.getByPlaceholder('Class name, e.g. 1-A or Grade 5').fill(className);
    await page.getByRole('button', { name: '+ Add class' }).click();

    const card = page.locator('.class-card', { hasText: className });
    await expect(card).toBeVisible();
    await expect(card.locator('.class-count')).toHaveText('0 students');
  });

  test('adding a student via the roster input lists them on the class card', async ({ page }) => {
    const className = uniqueClassName('Add student');
    await createTestClass(token, teacherId, className);

    await loginToApp(page, teacherEmail, PASSWORD);
    await openClassesTab(page);

    const card = page.locator('.class-card', { hasText: className });
    await card.getByPlaceholder('Student name').fill('Nina Peric');
    await card.getByRole('button', { name: '+ Add' }).click();

    await expect(card.locator('.student-tag', { hasText: 'Nina Peric' })).toBeVisible();
    await expect(card.locator('.class-count')).toHaveText('1 student');
  });

  test('removing a student via its roster tag drops them from the class card', async ({ page }) => {
    const className = uniqueClassName('Remove student');
    await createTestClass(token, teacherId, className, ['Nina Peric', 'Ivan Kovac']);

    await loginToApp(page, teacherEmail, PASSWORD);
    await openClassesTab(page);

    const card = page.locator('.class-card', { hasText: className });
    const tag = card.locator('.student-tag', { hasText: 'Nina Peric' });
    await expect(tag).toBeVisible();
    await tag.locator('button[title="Remove"]').click();

    await expect(tag).toHaveCount(0);
    await expect(card.locator('.student-tag', { hasText: 'Ivan Kovac' })).toBeVisible();
    await expect(card.locator('.class-count')).toHaveText('1 student');
  });

  test('deleting a class via its delete button removes it from the list', async ({ page }) => {
    const className = uniqueClassName('Delete class');
    await createTestClass(token, teacherId, className);

    await loginToApp(page, teacherEmail, PASSWORD);
    await openClassesTab(page);

    const card = page.locator('.class-card', { hasText: className });
    await expect(card).toBeVisible();
    await card.getByRole('button', { name: 'Delete class' }).click();

    await expect(card).toHaveCount(0);
  });

  // ─── XSS / HTML-injection resilience ────────────────────────────────────────
  // React escapes rendered text by default, but nothing previously verified
  // that explicitly for these free-text fields (docs/qa/test-coverage-todo.md).

  test('a class name containing a script tag renders as literal text, not markup', async ({ page }) => {
    const payload = `<script>window.__xssFired = true;</script>XSS-${Date.now()}`;

    await loginToApp(page, teacherEmail, PASSWORD);
    await openClassesTab(page);

    await page.getByPlaceholder('Class name, e.g. 1-A or Grade 5').fill(payload);
    await page.getByRole('button', { name: '+ Add class' }).click();

    const card = page.locator('.class-card', { hasText: payload });
    await expect(card).toBeVisible();
    await expect(card.locator('.class-name')).toHaveText(payload);
    // If this were rendered via dangerouslySetInnerHTML there'd be a real
    // <script> element here instead of an escaped text node.
    await expect(card.locator('.class-name script')).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { __xssFired?: boolean }).__xssFired)).toBeUndefined();
  });

  test('a student name containing an HTML tag renders as literal text, not markup', async ({ page }) => {
    const className = uniqueClassName('XSS student');
    await createTestClass(token, teacherId, className);
    const payload = '<img src=x onerror="window.__xssFired=true">';

    await loginToApp(page, teacherEmail, PASSWORD);
    await openClassesTab(page);

    const card = page.locator('.class-card', { hasText: className });
    await card.getByPlaceholder('Student name').fill(payload);
    await card.getByRole('button', { name: '+ Add' }).click();

    const tag = card.locator('.student-tag', { hasText: payload });
    await expect(tag).toBeVisible();
    await expect(tag.locator('img')).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { __xssFired?: boolean }).__xssFired)).toBeUndefined();
  });
});
