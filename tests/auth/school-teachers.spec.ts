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

import { test, expect } from '@playwright/test';
import {
  createConfirmedUser,
  getAccessToken,
  getProfile,
  setProfileRole,
  setProfileSchoolId,
  setProfileStatus,
  uniqueEmail,
} from '../helpers/cleanup';
import { loginToApp } from '../helpers/ui';
import { invokeEdgeFunction as invoke } from '../helpers/edgeFunctions';

// create-teacher sends an invite email (Supabase → Mailtrap), whose sandbox
// rate-limits sends — retry to ride out transient "Error sending invite email".
test.describe.configure({ retries: 2 });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? '';

const ENABLED = process.env.FEATURE_SCHOOL_TEACHERS === '1';
const PASSWORD = 'Test1234!';

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
      await getProfile(teacherEmail); // wait for on_auth_user_created trigger
      await setProfileStatus(teacherEmail, 'pending');

      await page.goto('/');
      await page.getByPlaceholder('your@email.com').fill(teacherEmail);
      await page.getByPlaceholder('Your password').fill(PASSWORD);
      await page.locator('button[type="submit"].gen-btn').click();

      await expect(page.getByText(/pending/i)).toBeVisible({ timeout: 25_000 });
      await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    });

    test('school can remove their own teacher (happy path)', async ({ request }) => {
      const schoolEmail = uniqueEmail('st-school-remove');
      await createConfirmedUser({ email: schoolEmail, password: PASSWORD, role: 'school' });
      const token = await getAccessToken(schoolEmail, PASSWORD);

      const teacherEmail = uniqueEmail('st-removable');
      await invoke(request, 'create-teacher', token, { email: teacherEmail, firstName: 'Remove', lastName: 'Me' });
      const teacher = await getProfile(teacherEmail);

      const { status, body } = await invoke(request, 'manage-teacher', token, {
        teacherId: teacher?.id,
        action: 'remove',
      });
      expect(status, JSON.stringify(body)).toBe(200);
    });

    test('create-teacher with missing email → 4xx', async ({ request }) => {
      const schoolEmail = uniqueEmail('st-school-nomail');
      await createConfirmedUser({ email: schoolEmail, password: PASSWORD, role: 'school' });
      const token = await getAccessToken(schoolEmail, PASSWORD);

      const { status } = await invoke(request, 'create-teacher', token, {
        firstName: 'No',
        lastName: 'Email',
      });
      expect(status).toBeGreaterThanOrEqual(400);
      expect(status).toBeLessThan(500);
    });

    test('manage-teacher with an unknown action → 400', async ({ request }) => {
      const schoolEmail = uniqueEmail('st-school-badact');
      await createConfirmedUser({ email: schoolEmail, password: PASSWORD, role: 'school' });
      const token = await getAccessToken(schoolEmail, PASSWORD);

      const teacherEmail = uniqueEmail('st-badact-teacher');
      await invoke(request, 'create-teacher', token, { email: teacherEmail, firstName: 'Bad', lastName: 'Action' });
      const teacher = await getProfile(teacherEmail);

      const { status } = await invoke(request, 'manage-teacher', token, {
        teacherId: teacher?.id,
        action: 'fly-to-moon',
      });
      expect(status).toBeGreaterThanOrEqual(400);
      expect(status).toBeLessThan(500);
    });

    test('pending teacher can activate their own account via activate_my_account RPC', async ({ request }) => {
      const teacherEmail = uniqueEmail('st-activate-teacher');
      await createConfirmedUser({ email: teacherEmail, password: PASSWORD, role: 'teacher' });
      await getProfile(teacherEmail);
      await setProfileStatus(teacherEmail, 'pending');

      const token = await getAccessToken(teacherEmail, PASSWORD);

      const res = await request.post(
        `${SUPABASE_URL}/rest/v1/rpc/activate_my_account`,
        {
          headers: {
            apikey: ANON_KEY,
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          data: {},
          failOnStatusCode: false,
        },
      );
      // void functions return 204 No Content in PostgREST
      const status = res.status();
      expect(status, `RPC failed: ${await res.text()}`).toBeGreaterThanOrEqual(200);
      expect(status).toBeLessThan(300);

      const profile = await getProfile(teacherEmail);
      expect(profile?.status).toBe('active');
    });

    test('school sees only their own teachers, not another school\'s (data isolation)', async ({ request }) => {
      const schoolAEmail = uniqueEmail('st-iso-schoolA');
      const schoolBEmail = uniqueEmail('st-iso-schoolB');
      await createConfirmedUser({ email: schoolAEmail, password: PASSWORD, role: 'school' });
      await createConfirmedUser({ email: schoolBEmail, password: PASSWORD, role: 'school' });
      const tokenA = await getAccessToken(schoolAEmail, PASSWORD);
      const tokenB = await getAccessToken(schoolBEmail, PASSWORD);

      const teacherAEmail = uniqueEmail('st-iso-teacherA');
      const teacherBEmail = uniqueEmail('st-iso-teacherB');
      await invoke(request, 'create-teacher', tokenA, { email: teacherAEmail, firstName: 'Alpha', lastName: 'Teacher' });
      await invoke(request, 'create-teacher', tokenB, { email: teacherBEmail, firstName: 'Beta', lastName: 'Teacher' });

      const res = await request.get(
        `${SUPABASE_URL}/rest/v1/profiles`,
        {
          headers: {
            apikey: ANON_KEY,
            Authorization: `Bearer ${tokenA}`,
            Accept: 'application/json',
          },
        },
      );
      expect(res.status()).toBe(200);
      const rows = await res.json() as Array<{ email: string }>;
      const emails = rows.map(r => r.email);

      expect(emails).toContain(teacherAEmail.toLowerCase());
      expect(emails).not.toContain(teacherBEmail.toLowerCase());
    });

    test('deactivating a teacher blocks subsequent login attempts', async ({ request }) => {
      const schoolEmail = uniqueEmail('st-deact-school');
      const teacherEmail = uniqueEmail('st-deact-teacher');
      await createConfirmedUser({ email: schoolEmail, password: PASSWORD, role: 'school' });
      await createConfirmedUser({ email: teacherEmail, password: PASSWORD, role: 'teacher' });

      const school = await getProfile(schoolEmail);
      const teacher = await getProfile(teacherEmail);
      // Link teacher to school so manage-teacher accepts the request
      await setProfileSchoolId(teacherEmail, school!.id);

      // Verify login works before deactivation
      await getAccessToken(teacherEmail, PASSWORD);

      const schoolToken = await getAccessToken(schoolEmail, PASSWORD);
      const { status, body } = await invoke(request, 'manage-teacher', schoolToken, {
        teacherId: teacher?.id,
        action: 'deactivate',
      });
      expect(status, `deactivate failed: ${JSON.stringify(body)}`).toBe(200);

      // After ban_duration is set by manage-teacher, a new login attempt must fail
      await expect(getAccessToken(teacherEmail, PASSWORD)).rejects.toThrow();
    });

    test('create-teacher with a duplicate (already-registered) email → error', async ({ request }) => {
      const schoolEmail = uniqueEmail('st-dup-school');
      const existingEmail = uniqueEmail('st-dup-existing');
      await createConfirmedUser({ email: schoolEmail, password: PASSWORD, role: 'school' });
      // Pre-register the email that the school will try to invite
      await createConfirmedUser({ email: existingEmail, password: PASSWORD, role: 'teacher' });

      const token = await getAccessToken(schoolEmail, PASSWORD);
      const { status } = await invoke(request, 'create-teacher', token, {
        email: existingEmail,
        firstName: 'Dupe',
        lastName: 'User',
      });
      expect(status).toBeGreaterThanOrEqual(400);
      expect(status).toBeLessThan(600);
    });

    // Scenario gap flagged in docs/qa/test-scenarios.pdf §5 (2026-07-03 code review):
    // manage-teacher's "remove" action deletes the teacher's auth.users row, which
    // cascades (classes.owner_id / records.owner_id both `on delete cascade` from
    // auth.users) to permanently delete every class and record that teacher owns.
    // The existing happy-path test never gave the teacher any data to lose, so it
    // never actually exercised the cascade.
    test('removing a teacher cascades to delete their classes and records', async ({ request }) => {
      const schoolEmail = uniqueEmail('st-cascade-school');
      const teacherEmail = uniqueEmail('st-cascade-teacher');
      const adminEmail = uniqueEmail('st-cascade-admin');
      await createConfirmedUser({ email: schoolEmail, password: PASSWORD, role: 'school' });
      await createConfirmedUser({ email: teacherEmail, password: PASSWORD, role: 'teacher' });
      // Superadmin used only to read the class/record rows after the teacher (and
      // their own token) no longer exist -- RLS otherwise scopes them to the owner.
      await createConfirmedUser({ email: adminEmail, password: PASSWORD, role: 'teacher' });
      await getProfile(adminEmail);
      await setProfileRole(adminEmail, 'superadmin');

      const school = await getProfile(schoolEmail);
      const teacher = await getProfile(teacherEmail);
      await setProfileSchoolId(teacherEmail, school!.id);

      const teacherToken = await getAccessToken(teacherEmail, PASSWORD);
      const classId = `c_test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const classHeaders = {
        apikey: ANON_KEY,
        Authorization: `Bearer ${teacherToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      };
      const classRes = await request.post(`${SUPABASE_URL}/rest/v1/classes`, {
        headers: classHeaders,
        data: { id: classId, name: 'Cascade Test Class', owner_id: teacher!.id, students: ['Alice'] },
      });
      expect(classRes.status(), await classRes.text()).toBe(201);

      const recordRes = await request.post(`${SUPABASE_URL}/rest/v1/records`, {
        headers: { ...classHeaders, Prefer: 'return=representation,resolution=merge-duplicates' },
        data: { class_id: classId, owner_id: teacher!.id, data: { attendance: {}, payment: {}, grades: {} }, updated_at: new Date().toISOString() },
      });
      expect(recordRes.status(), await recordRes.text()).toBe(201);

      // Precondition: both rows genuinely exist before removal.
      const adminToken = await getAccessToken(adminEmail, PASSWORD);
      const adminHeaders = { apikey: ANON_KEY, Authorization: `Bearer ${adminToken}` };
      const classBefore = await request.get(`${SUPABASE_URL}/rest/v1/classes?id=eq.${classId}`, { headers: adminHeaders });
      expect((await classBefore.json() as unknown[]).length).toBe(1);
      const recordBefore = await request.get(`${SUPABASE_URL}/rest/v1/records?class_id=eq.${classId}`, { headers: adminHeaders });
      expect((await recordBefore.json() as unknown[]).length).toBe(1);

      const schoolToken = await getAccessToken(schoolEmail, PASSWORD);
      const { status, body } = await invoke(request, 'manage-teacher', schoolToken, {
        teacherId: teacher?.id,
        action: 'remove',
      });
      expect(status, JSON.stringify(body)).toBe(200);

      expect(await getProfile(teacherEmail)).toBeNull();
      const classAfter = await request.get(`${SUPABASE_URL}/rest/v1/classes?id=eq.${classId}`, { headers: adminHeaders });
      expect((await classAfter.json() as unknown[]).length).toBe(0);
      const recordAfter = await request.get(`${SUPABASE_URL}/rest/v1/records?class_id=eq.${classId}`, { headers: adminHeaders });
      expect((await recordAfter.json() as unknown[]).length).toBe(0);
    });

    test('remove-teacher confirm dialog discloses class/record deletion', async ({ page }) => {
      const schoolEmail = uniqueEmail('st-dialog-school');
      const teacherEmail = uniqueEmail('st-dialog-teacher');
      await createConfirmedUser({ email: schoolEmail, password: PASSWORD, role: 'school' });
      await createConfirmedUser({ email: teacherEmail, password: PASSWORD, role: 'teacher' });
      const school = await getProfile(schoolEmail);
      await setProfileSchoolId(teacherEmail, school!.id);

      await loginToApp(page, schoolEmail, PASSWORD);
      await page.locator('button.tab', { hasText: 'Employees' }).click();
      await expect(page.getByText(teacherEmail)).toBeVisible();

      let dialogMessage = '';
      page.once('dialog', async (dialog) => {
        dialogMessage = dialog.message();
        await dialog.dismiss(); // don't actually remove the teacher in this test
      });
      await page.locator('tr', { hasText: teacherEmail }).getByRole('button', { name: 'Remove' }).click();

      await expect.poll(() => dialogMessage).toContain('classes');
      expect(dialogMessage).toContain('records');
      expect(dialogMessage).toContain('cannot be undone');
      // Dismissed, so the teacher must still exist.
      expect(await getProfile(teacherEmail)).not.toBeNull();
    });
  });
}
