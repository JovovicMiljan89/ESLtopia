// tests/auth/school-teachers.spec.ts
//
// Tests for the "school creates & manages teachers" feature.
//
// These require the new pieces to be live in production:
//   1. DB migration applied   (supabase db push)
//   2. Edge functions deployed (supabase functions deploy create-teacher manage-teacher)
//   3. App deployed            (git push → Vercel)
//
// Until then they are skipped. After deploying, enable them by setting
// FEATURE_SCHOOL_TEACHERS=1 in .env.test.local and run `npm test`.

import { test, expect, type APIRequestContext } from '@playwright/test';
import {
  createConfirmedUser,
  getProfile,
  getAccessToken,
  setProfileStatus,
  uniqueEmail,
} from '../helpers/cleanup';
import { loginToApp } from '../helpers/ui';

// create-teacher sends an invite email (Supabase → Mailtrap), whose sandbox
// rate-limits sends — retry to ride out transient "Error sending invite email".
test.describe.configure({ retries: 2 });

const ENABLED = process.env.FEATURE_SCHOOL_TEACHERS === '1';
const PASSWORD = 'Test1234!';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? '';

async function invoke(
  request: APIRequestContext,
  fn: string,
  token: string,
  payload: unknown,
) {
  const res = await request.post(`${SUPABASE_URL}/functions/v1/${fn}`, {
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: payload,
    failOnStatusCode: false,
  });
  let body: unknown = null;
  try { body = await res.json(); } catch { /* ignore */ }
  return { status: res.status(), body };
}

if (!ENABLED) {
  test('school → teachers feature (skipped until deployed)', () => {
    test.skip(true, 'Deploy migration + edge functions + app, then set FEATURE_SCHOOL_TEACHERS=1');
  });
} else {
  test.describe('school creates & manages teachers', () => {
    test('school can create a teacher (pending, linked to the school)', async ({ request }) => {
      const schoolEmail = uniqueEmail('st-school');
      await createConfirmedUser({ email: schoolEmail, password: PASSWORD, role: 'school' });
      const school = await getProfile(schoolEmail);
      const token = await getAccessToken(schoolEmail, PASSWORD);

      const teacherEmail = uniqueEmail('st-teacher');
      const { status, body } = await invoke(request, 'create-teacher', token, {
        email: teacherEmail,
        firstName: 'New',
        lastName: 'Teacher',
      });
      expect(status, JSON.stringify(body)).toBe(200);
      expect((body as { ok: boolean }).ok).toBe(true);

      const teacher = await getProfile(teacherEmail);
      expect(teacher?.role).toBe('teacher');
      expect(teacher?.status).toBe('pending');
      expect(teacher?.school_id).toBe(school?.id);
    });

    test('a teacher account cannot create teachers (403)', async ({ request }) => {
      const teacherEmail = uniqueEmail('st-plain-teacher');
      await createConfirmedUser({ email: teacherEmail, password: PASSWORD, role: 'teacher' });
      const token = await getAccessToken(teacherEmail, PASSWORD);

      const { status } = await invoke(request, 'create-teacher', token, {
        email: uniqueEmail('st-victim'),
        firstName: 'X',
        lastName: 'Y',
      });
      expect(status).toBe(403);
    });

    test("a school cannot manage another school's teacher (403)", async ({ request }) => {
      const schoolAEmail = uniqueEmail('st-schoolA');
      const schoolBEmail = uniqueEmail('st-schoolB');
      await createConfirmedUser({ email: schoolAEmail, password: PASSWORD, role: 'school' });
      await createConfirmedUser({ email: schoolBEmail, password: PASSWORD, role: 'school' });
      const tokenA = await getAccessToken(schoolAEmail, PASSWORD);
      const tokenB = await getAccessToken(schoolBEmail, PASSWORD);

      const teacherEmail = uniqueEmail('st-A-teacher');
      await invoke(request, 'create-teacher', tokenA, {
        email: teacherEmail, firstName: 'A', lastName: 'Teacher',
      });
      const teacher = await getProfile(teacherEmail);

      // School B tries to remove A's teacher → forbidden.
      const { status } = await invoke(request, 'manage-teacher', tokenB, {
        teacherId: teacher?.id, action: 'remove',
      });
      expect(status).toBe(403);
      expect(await getProfile(teacherEmail)).not.toBeNull();
    });

    test('deactivate then reactivate toggles teacher status', async ({ request }) => {
      const schoolEmail = uniqueEmail('st-school-toggle');
      await createConfirmedUser({ email: schoolEmail, password: PASSWORD, role: 'school' });
      const token = await getAccessToken(schoolEmail, PASSWORD);

      const teacherEmail = uniqueEmail('st-toggle-teacher');
      await invoke(request, 'create-teacher', token, {
        email: teacherEmail, firstName: 'T', lastName: 'Toggle',
      });
      const teacher = await getProfile(teacherEmail);

      let res = await invoke(request, 'manage-teacher', token, { teacherId: teacher?.id, action: 'deactivate' });
      expect(res.status).toBe(200);
      expect((await getProfile(teacherEmail))?.status).toBe('inactive');

      res = await invoke(request, 'manage-teacher', token, { teacherId: teacher?.id, action: 'reactivate' });
      expect(res.status).toBe(200);
      expect((await getProfile(teacherEmail))?.status).toBe('active');
    });

    test('school sees the Employees tab but not the global Admin tab', async ({ page }) => {
      const schoolEmail = uniqueEmail('st-school-ui');
      await createConfirmedUser({ email: schoolEmail, password: PASSWORD, role: 'school' });

      await loginToApp(page, schoolEmail, PASSWORD);
      await expect(page.locator('button.tab', { hasText: 'Employees' })).toBeVisible();
      await expect(page.locator('button.tab', { hasText: 'Admin' })).toHaveCount(0);
    });

    test('a pending teacher cannot log in', async ({ page }) => {
      const teacherEmail = uniqueEmail('st-pending-login');
      await createConfirmedUser({ email: teacherEmail, password: PASSWORD, role: 'teacher' });
      await setProfileStatus(teacherEmail, 'pending');

      await page.goto('/');
      await page.getByPlaceholder('your@email.com').fill(teacherEmail);
      await page.getByPlaceholder('Your password').fill(PASSWORD);
      await page.locator('button[type="submit"].gen-btn').click();

      await expect(page.getByText(/pending/i)).toBeVisible({ timeout: 15_000 });
      await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    });
  });
}
