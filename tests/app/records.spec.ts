// tests/app/records.spec.ts
//
// UI tests for the Records tab (attendance / grades / payment tracking) and the
// per-student profile modal it opens into. Unlike classes.spec.ts and
// profile.spec.ts (REST-only), this drives the actual React UI, since the
// click handlers themselves (toggleAttendance, setGradeScore, togglePayment,
// updateNote) had no coverage at all before this file.
//
// Each test creates its own class (rather than sharing one fixture class
// across the describe block) because tests run fullyParallel — a shared class
// would race on the same attendance/payment/grades record.
//
// Record writes are synced to Supabase on an 800ms debounce (syncRecord in
// EnglishGenerator.jsx) with no visible "saved" indicator, so persistence
// tests wait for the upsert carrying the edit to be acknowledged (see
// waitForRecordSave) and then reload the page to confirm the data was
// actually written, not just held in local React state. A fixed sleep used to
// stand in for that wait and flaked whenever the round-trip ran slow.

import { type Page } from '@playwright/test';
import { test, expect } from '../helpers/fixtures';
import { createConfirmedUser, getAccessToken, getProfile, uniqueEmail } from '../helpers/cleanup';
import { loginToApp } from '../helpers/ui';

const PASSWORD = 'Test1234!';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? '';

function uniqueClassId() {
  return `c_test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

async function createTestClass(token: string, ownerId: string, name: string, students: string[]): Promise<string> {
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

// Resolves once Supabase has acknowledged a records upsert for `classId` whose
// payload satisfies `saved`. Matching on content (not just "the next POST")
// matters because an earlier edit's debounced write may still be in flight.
// Must be called before the edit that triggers the write.
// `data` is the untyped records.data JSON blob.
function waitForRecordSave(page: Page, classId: string, saved: (data: any) => boolean) {
  return page.waitForResponse((res) => {
    const req = res.request();
    if (req.method() !== 'POST' || !req.url().includes('/rest/v1/records')) return false;
    const body = req.postDataJSON();
    const row = Array.isArray(body) ? body[0] : body;
    return row?.class_id === classId && saved(row.data ?? {}) && res.ok();
  }, { timeout: 15_000 });
}

// True when any date/month bucket in a records section (grades, payment, ...)
// holds `value` for `student`.
function hasStudentValue(section: Record<string, Record<string, unknown>> | undefined, student: string, value: unknown) {
  return Object.values(section ?? {}).some((bucket) => bucket?.[student] === value);
}

async function openRecordsTab(page: Page, className: string) {
  await page.locator('button.tab', { hasText: 'Records' }).click();
  await page.locator('.records-controls select').selectOption({ label: className });
}

async function reloadIntoRecordsTab(page: Page, className: string) {
  await page.reload();
  await expect(page.getByRole('button', { name: /get started/i })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: /get started/i }).click();
  await openRecordsTab(page, className);
}

test.describe('Records tab: empty state', () => {
  const teacherEmail = uniqueEmail('records-empty');

  test.beforeAll(async () => {
    await createConfirmedUser({ email: teacherEmail, password: PASSWORD, role: 'teacher' });
  });

  test('shows an empty state when the teacher has no classes', async ({ page }) => {
    await loginToApp(page, teacherEmail, PASSWORD);
    await page.locator('button.tab', { hasText: 'Records' }).click();
    await expect(page.locator('.empty-state')).toContainText('no classes for records');
  });
});

test.describe('Records tab: attendance, grades, and payment', () => {
  const teacherEmail = uniqueEmail('records-tab');
  let teacherId: string;
  let token: string;

  test.beforeAll(async () => {
    await createConfirmedUser({ email: teacherEmail, password: PASSWORD, role: 'teacher' });
    const profile = await getProfile(teacherEmail);
    teacherId = profile!.id;
    token = await getAccessToken(teacherEmail, PASSWORD);
  });

  function uniqueClassName(label: string) {
    return `${label} ${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  }

  test('selecting a class lists its students in the records table', async ({ page }) => {
    const className = uniqueClassName('List students');
    await createTestClass(token, teacherId, className, ['Ana Ilic', 'Marko Jovic']);

    await loginToApp(page, teacherEmail, PASSWORD);
    await openRecordsTab(page, className);

    await expect(page.locator('.records-table tbody tr')).toHaveCount(2);
    await expect(page.locator('.student-link', { hasText: 'Ana Ilic' })).toBeVisible();
    await expect(page.locator('.student-link', { hasText: 'Marko Jovic' })).toBeVisible();
  });

  test('marking a student present updates their row and the summary count', async ({ page }) => {
    const className = uniqueClassName('Mark present');
    await createTestClass(token, teacherId, className, ['Ana Ilic', 'Marko Jovic']);

    await loginToApp(page, teacherEmail, PASSWORD);
    await openRecordsTab(page, className);

    const row = page.locator('.records-table tbody tr', { hasText: 'Ana Ilic' });
    await expect(row.getByRole('button', { name: 'Absent' })).toBeVisible();

    await row.getByRole('button', { name: 'Absent' }).click();
    await expect(row.getByRole('button', { name: 'Present' })).toBeVisible();
    await expect(
      page.locator('.pay-summary-item', { hasText: 'Present today' }).locator('.pay-summary-value'),
    ).toHaveText('1 / 2');
  });

  test('"All present" marks every student present', async ({ page }) => {
    const className = uniqueClassName('All present');
    await createTestClass(token, teacherId, className, ['Ana Ilic', 'Marko Jovic']);

    await loginToApp(page, teacherEmail, PASSWORD);
    await openRecordsTab(page, className);

    await page.getByRole('button', { name: /all present/i }).click();
    await expect(page.locator('.records-table tbody tr').getByRole('button', { name: 'Present' })).toHaveCount(2);
    await expect(
      page.locator('.pay-summary-item', { hasText: 'Present today' }).locator('.pay-summary-value'),
    ).toHaveText('2 / 2');
  });

  test('a grade set on a student persists across a reload', async ({ page }) => {
    const className = uniqueClassName('Grade persists');
    const classId = await createTestClass(token, teacherId, className, ['Ana Ilic', 'Marko Jovic']);

    await loginToApp(page, teacherEmail, PASSWORD);
    await openRecordsTab(page, className);

    const row = page.locator('.records-table tbody tr', { hasText: 'Marko Jovic' });
    const saved = waitForRecordSave(page, classId, (d) => hasStudentValue(d.grades, 'Marko Jovic', '5'));
    await row.locator('select.grade-select').selectOption('5');

    await saved;
    await reloadIntoRecordsTab(page, className);

    const rowAfterReload = page.locator('.records-table tbody tr', { hasText: 'Marko Jovic' });
    await expect(rowAfterReload.locator('select.grade-select')).toHaveValue('5');
  });

  test('marking a student paid updates the summary and persists across a reload', async ({ page }) => {
    const className = uniqueClassName('Payment persists');
    const classId = await createTestClass(token, teacherId, className, ['Ana Ilic', 'Marko Jovic']);

    await loginToApp(page, teacherEmail, PASSWORD);
    await openRecordsTab(page, className);

    const row = page.locator('.records-table tbody tr', { hasText: 'Ana Ilic' });
    const saved = waitForRecordSave(page, classId, (d) => hasStudentValue(d.payment, 'Ana Ilic', true));
    await row.getByRole('button', { name: 'Not paid' }).click();
    await expect(row.getByRole('button', { name: 'Paid' })).toBeVisible();
    await expect(
      page.locator('.pay-summary-item', { hasText: 'Paid (' }).locator('.pay-summary-value'),
    ).toHaveText('1 / 2');

    await saved;
    await reloadIntoRecordsTab(page, className);

    const rowAfterReload = page.locator('.records-table tbody tr', { hasText: 'Ana Ilic' });
    await expect(rowAfterReload.getByRole('button', { name: 'Paid' })).toBeVisible();
  });

  // Scenario gap flagged in docs/qa/test-scenarios.pdf §7 (2026-07-03 code review):
  // syncRecord now logs a failed upsert instead of discarding it silently, but
  // nothing verified that path actually fires -- or that logging isn't mistaken
  // for the write having actually succeeded.
  test('a failed record save is logged to the console and is not silently persisted', async ({ page }) => {
    const className = uniqueClassName('Sync failure');
    await createTestClass(token, teacherId, className, ['Ana Ilic']);

    await loginToApp(page, teacherEmail, PASSWORD);
    await openRecordsTab(page, className);

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // Force the debounced upsert to fail the way a real Supabase error response
    // does (RLS denial / server error) -- a resolved {error}, not a thrown
    // network exception -- without touching the GET that loads existing records.
    await page.route('**/rest/v1/records*', async (route) => {
      if (['POST', 'PATCH', 'PUT'].includes(route.request().method())) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'simulated failure', code: '500' }),
        });
      } else {
        await route.continue();
      }
    });

    const row = page.locator('.records-table tbody tr', { hasText: 'Ana Ilic' });
    await row.getByRole('button', { name: 'Absent' }).click();
    await expect(row.getByRole('button', { name: 'Present' })).toBeVisible(); // optimistic local update

    await expect.poll(
      () => consoleErrors.some((m) => m.includes('Failed to save record')),
      { timeout: 5_000 },
    ).toBe(true);

    // The debounced write never actually reached the server -- remove the
    // interception so a fresh load reads real server state, and confirm the
    // "Present" mark was lost. Logging the failure doesn't make it durable.
    await page.unroute('**/rest/v1/records*');
    await reloadIntoRecordsTab(page, className);
    const rowAfterReload = page.locator('.records-table tbody tr', { hasText: 'Ana Ilic' });
    await expect(rowAfterReload.getByRole('button', { name: 'Absent' })).toBeVisible();
  });

  test('opening a student profile shows their attendance stats and saves a note', async ({ page }) => {
    const className = uniqueClassName('Student profile');
    const classId = await createTestClass(token, teacherId, className, ['Marko Jovic']);

    await loginToApp(page, teacherEmail, PASSWORD);
    await openRecordsTab(page, className);

    const row = page.locator('.records-table tbody tr', { hasText: 'Marko Jovic' });
    await row.getByRole('button', { name: 'Absent' }).click();
    await expect(row.getByRole('button', { name: 'Present' })).toBeVisible();

    await page.locator('.student-link', { hasText: 'Marko Jovic' }).click();
    await expect(page.locator('.modal-name')).toHaveText('Marko Jovic');
    await expect(page.locator('.profile-stat.stat-present .profile-stat-value')).toHaveText('1');

    const note = 'Great progress this term.';
    const saved = waitForRecordSave(page, classId, (d) => d.notes?.['Marko Jovic'] === note);
    await page.locator('.notes-area').fill(note);
    await saved;
    await reloadIntoRecordsTab(page, className);

    await page.locator('.student-link', { hasText: 'Marko Jovic' }).click();
    await expect(page.locator('.notes-area')).toHaveValue('Great progress this term.');
  });

  // Regression test for the cause of this file's CI flakes ("Expected 1,
  // Received 0" on the profile stat, "0 / 2" on the paid summary). The app used
  // to list classes before their records had loaded, so an edit made in that
  // window was wiped when the records response replaced the whole map. Holding
  // the response back makes the window wide enough to hit every time.
  test('an edit made while records are still loading is not wiped when they arrive', async ({ page }) => {
    const className = uniqueClassName('Slow records');
    await createTestClass(token, teacherId, className, ['Marko Jovic']);

    let recordsDelivered = false;
    await page.route('**/rest/v1/records*', async (route) => {
      if (route.request().method() !== 'GET') return route.continue();
      // Fetch now so the server answers with the pre-edit state, deliver late.
      const response = await route.fetch();
      await new Promise((resolve) => setTimeout(resolve, 2_000));
      await route.fulfill({ response });
      recordsDelivered = true;
    });

    await loginToApp(page, teacherEmail, PASSWORD);
    await openRecordsTab(page, className);

    const row = page.locator('.records-table tbody tr', { hasText: 'Marko Jovic' });
    await row.getByRole('button', { name: 'Absent' }).click();
    await expect(row.getByRole('button', { name: 'Present' })).toBeVisible();

    await expect.poll(() => recordsDelivered, { timeout: 10_000 }).toBe(true);
    await expect(row.getByRole('button', { name: 'Present' })).toBeVisible();
    await page.locator('.student-link', { hasText: 'Marko Jovic' }).click();
    await expect(page.locator('.profile-stat.stat-present .profile-stat-value')).toHaveText('1');
  });

  // XSS/HTML-injection resilience gap flagged in docs/qa/test-coverage-todo.md:
  // notes render inside a <textarea> value, which is never HTML-parsed regardless
  // of framework, but nothing previously verified the round trip stores and
  // redisplays markup as literal text rather than, say, stripping or mangling it.
  test('a note containing HTML markup is stored and redisplayed as literal text', async ({ page }) => {
    const className = uniqueClassName('XSS note');
    const classId = await createTestClass(token, teacherId, className, ['Ana Ilic']);
    const payload = '<b>bold</b> <script>window.__xssFired = true;</script>';

    await loginToApp(page, teacherEmail, PASSWORD);
    await openRecordsTab(page, className);

    await page.locator('.student-link', { hasText: 'Ana Ilic' }).click();
    const saved = waitForRecordSave(page, classId, (d) => d.notes?.['Ana Ilic'] === payload);
    await page.locator('.notes-area').fill(payload);
    await saved;
    await reloadIntoRecordsTab(page, className);

    await page.locator('.student-link', { hasText: 'Ana Ilic' }).click();
    await expect(page.locator('.notes-area')).toHaveValue(payload);
    expect(await page.evaluate(() => (window as unknown as { __xssFired?: boolean }).__xssFired)).toBeUndefined();
  });
});
