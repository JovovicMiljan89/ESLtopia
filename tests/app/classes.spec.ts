// tests/app/classes.spec.ts
//
// Tests for the classes and records data layer.
//   A class has an owner (teacher) and a jsonb students array.
//   A record is keyed by class_id (1-to-1) and holds attendance/grades/payment data.
//
// RLS:
//   classes  — "Users manage own classes":  owner_id = auth.uid() OR superadmin
//   records  — "Users manage own records":  owner_id = auth.uid() OR superadmin
//
// Cascade: deleting a class also deletes its record (ON DELETE CASCADE on class_id).
// Cleanup:  test users use @example.test — global teardown purges them, which
//           cascade-deletes all their classes and records automatically.

import { test, expect } from '@playwright/test';
import {
  createConfirmedUser,
  getAccessToken,
  getProfile,
  setProfileRole,
  uniqueEmail,
} from '../helpers/cleanup';

const PASSWORD = 'Test1234!';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? '';

function uniqueClassId() {
  return `c_test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function h(token: string, extra: Record<string, string> = {}) {
  return {
    apikey: ANON_KEY,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

// ─── Classes: CRUD ────────────────────────────────────────────────────────────

test.describe('classes: CRUD', () => {
  const email = uniqueEmail('cls-crud');
  let teacherId: string;
  let token: string;

  test.beforeAll(async () => {
    await createConfirmedUser({ email, password: PASSWORD, role: 'teacher' });
    const profile = await getProfile(email);
    teacherId = profile!.id;
    token = await getAccessToken(email, PASSWORD);
  });

  test('teacher can create a class', async ({ request }) => {
    const id = uniqueClassId();
    const res = await request.post(`${SUPABASE_URL}/rest/v1/classes`, {
      headers: h(token, { Prefer: 'return=representation' }),
      data: { id, name: 'Grade 5A', owner_id: teacherId, students: [] },
    });
    expect(res.status()).toBe(201);
    const rows = await res.json() as Array<{ id: string; name: string }>;
    expect(rows[0].id).toBe(id);
    expect(rows[0].name).toBe('Grade 5A');
  });

  test('teacher can list their own classes', async ({ request }) => {
    const id = uniqueClassId();
    await request.post(`${SUPABASE_URL}/rest/v1/classes`, {
      headers: h(token, { Prefer: 'return=representation' }),
      data: { id, name: 'Listing Class', owner_id: teacherId, students: [] },
    });

    const res = await request.get(
      `${SUPABASE_URL}/rest/v1/classes?id=eq.${id}`,
      { headers: h(token) },
    );
    expect(res.status()).toBe(200);
    const rows = await res.json() as Array<{ id: string; name: string }>;
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Listing Class');
  });

  test('teacher can rename a class', async ({ request }) => {
    const id = uniqueClassId();
    await request.post(`${SUPABASE_URL}/rest/v1/classes`, {
      headers: h(token, { Prefer: 'return=representation' }),
      data: { id, name: 'Old Name', owner_id: teacherId, students: [] },
    });

    const res = await request.patch(
      `${SUPABASE_URL}/rest/v1/classes?id=eq.${id}`,
      {
        headers: h(token, { Prefer: 'return=representation' }),
        data: { name: 'New Name' },
      },
    );
    expect(res.status()).toBe(200);
    const rows = await res.json() as Array<{ name: string }>;
    expect(rows[0].name).toBe('New Name');
  });

  test('teacher can delete a class', async ({ request }) => {
    const id = uniqueClassId();
    await request.post(`${SUPABASE_URL}/rest/v1/classes`, {
      headers: h(token, { Prefer: 'return=representation' }),
      data: { id, name: 'Delete Me', owner_id: teacherId, students: [] },
    });

    const del = await request.delete(
      `${SUPABASE_URL}/rest/v1/classes?id=eq.${id}`,
      { headers: h(token) },
    );
    expect(del.status()).toBe(204);

    const check = await request.get(
      `${SUPABASE_URL}/rest/v1/classes?id=eq.${id}`,
      { headers: h(token) },
    );
    expect((await check.json() as unknown[]).length).toBe(0);
  });
});

// ─── Classes: student management ──────────────────────────────────────────────

test.describe('classes: student management', () => {
  const email = uniqueEmail('cls-students');
  let teacherId: string;
  let token: string;
  let classId: string;

  test.beforeAll(async ({ request }) => {
    await createConfirmedUser({ email, password: PASSWORD, role: 'teacher' });
    const profile = await getProfile(email);
    teacherId = profile!.id;
    token = await getAccessToken(email, PASSWORD);

    classId = uniqueClassId();
    await request.post(`${SUPABASE_URL}/rest/v1/classes`, {
      headers: h(token, { Prefer: 'return=representation' }),
      data: { id: classId, name: 'Student Class', owner_id: teacherId, students: [] },
    });
  });

  test('teacher can add students to a class', async ({ request }) => {
    const res = await request.patch(
      `${SUPABASE_URL}/rest/v1/classes?id=eq.${classId}`,
      {
        headers: h(token, { Prefer: 'return=representation' }),
        data: { students: ['Alice', 'Bob', 'Charlie'] },
      },
    );
    expect(res.status()).toBe(200);
    const rows = await res.json() as Array<{ students: string[] }>;
    expect(rows[0].students).toEqual(['Alice', 'Bob', 'Charlie']);
  });

  test('teacher can remove a student from a class', async ({ request }) => {
    const res = await request.patch(
      `${SUPABASE_URL}/rest/v1/classes?id=eq.${classId}`,
      {
        headers: h(token, { Prefer: 'return=representation' }),
        data: { students: ['Alice', 'Charlie'] },
      },
    );
    expect(res.status()).toBe(200);
    const rows = await res.json() as Array<{ students: string[] }>;
    expect(rows[0].students).not.toContain('Bob');
    expect(rows[0].students).toContain('Alice');
    expect(rows[0].students).toContain('Charlie');
  });
});

// ─── Classes: RLS isolation ───────────────────────────────────────────────────

test.describe('classes: RLS isolation', () => {
  const emailA = uniqueEmail('cls-rls-a');
  const emailB = uniqueEmail('cls-rls-b');
  let teacherAId: string;
  let tokenA: string;
  let tokenB: string;
  let classId: string;

  test.beforeAll(async ({ request }) => {
    await createConfirmedUser({ email: emailA, password: PASSWORD, role: 'teacher' });
    await createConfirmedUser({ email: emailB, password: PASSWORD, role: 'teacher' });
    const profileA = await getProfile(emailA);
    teacherAId = profileA!.id;
    tokenA = await getAccessToken(emailA, PASSWORD);
    tokenB = await getAccessToken(emailB, PASSWORD);

    classId = uniqueClassId();
    await request.post(`${SUPABASE_URL}/rest/v1/classes`, {
      headers: h(tokenA, { Prefer: 'return=representation' }),
      data: { id: classId, name: 'Teacher A Class', owner_id: teacherAId, students: [] },
    });
  });

  test("teacher cannot read another teacher's class (RLS filters it out)", async ({ request }) => {
    const res = await request.get(
      `${SUPABASE_URL}/rest/v1/classes?id=eq.${classId}`,
      { headers: h(tokenB) },
    );
    expect(res.status()).toBe(200);
    expect((await res.json() as unknown[]).length).toBe(0);
  });

  test("teacher cannot insert a class with another teacher's owner_id (RLS blocks it)", async ({ request }) => {
    const id = uniqueClassId();
    const res = await request.post(`${SUPABASE_URL}/rest/v1/classes`, {
      headers: h(tokenB, { Prefer: 'return=representation' }),
      data: { id, name: 'Forged Owner Class', owner_id: teacherAId, students: [] },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(403);

    const check = await request.get(
      `${SUPABASE_URL}/rest/v1/classes?id=eq.${id}`,
      { headers: h(tokenA) },
    );
    expect((await check.json() as unknown[]).length).toBe(0);
  });

  test("teacher cannot delete another teacher's class (RLS blocks it)", async ({ request }) => {
    const del = await request.delete(
      `${SUPABASE_URL}/rest/v1/classes?id=eq.${classId}`,
      { headers: h(tokenB), failOnStatusCode: false },
    );
    // RLS filters the row out of the USING clause rather than raising an
    // error — PostgREST reports success (204, no rows matched) either way.
    expect(del.status()).toBe(204);

    // Class must still be visible to Teacher A
    const check = await request.get(
      `${SUPABASE_URL}/rest/v1/classes?id=eq.${classId}`,
      { headers: h(tokenA) },
    );
    expect((await check.json() as unknown[]).length).toBe(1);
  });
});

// ─── Records: CRUD ────────────────────────────────────────────────────────────

test.describe('records: CRUD', () => {
  const email = uniqueEmail('rec-crud');
  let teacherId: string;
  let token: string;
  let classId: string;

  test.beforeAll(async ({ request }) => {
    await createConfirmedUser({ email, password: PASSWORD, role: 'teacher' });
    const profile = await getProfile(email);
    teacherId = profile!.id;
    token = await getAccessToken(email, PASSWORD);

    // Fixture class + record used by the read and upsert tests
    classId = uniqueClassId();
    await request.post(`${SUPABASE_URL}/rest/v1/classes`, {
      headers: h(token, { Prefer: 'return=representation' }),
      data: { id: classId, name: 'Records Class', owner_id: teacherId, students: ['Alice'] },
    });
    await request.post(`${SUPABASE_URL}/rest/v1/records`, {
      headers: h(token, { Prefer: 'return=representation,resolution=merge-duplicates' }),
      data: { class_id: classId, owner_id: teacherId, data: { attendance: {}, payment: {}, grades: {} }, updated_at: new Date().toISOString() },
    });
  });

  test('teacher can create records for their own class', async ({ request }) => {
    const freshId = uniqueClassId();
    await request.post(`${SUPABASE_URL}/rest/v1/classes`, {
      headers: h(token, { Prefer: 'return=representation' }),
      data: { id: freshId, name: 'Fresh Class', owner_id: teacherId, students: [] },
    });

    const res = await request.post(`${SUPABASE_URL}/rest/v1/records`, {
      headers: h(token, { Prefer: 'return=representation,resolution=merge-duplicates' }),
      data: { class_id: freshId, owner_id: teacherId, data: { attendance: {}, payment: {}, grades: {} }, updated_at: new Date().toISOString() },
    });
    expect(res.status()).toBe(201);
    const rows = await res.json() as Array<{ class_id: string }>;
    expect(rows[0].class_id).toBe(freshId);
  });

  test('teacher can read their own records', async ({ request }) => {
    const res = await request.get(
      `${SUPABASE_URL}/rest/v1/records?class_id=eq.${classId}`,
      { headers: h(token) },
    );
    expect(res.status()).toBe(200);
    const rows = await res.json() as Array<{ class_id: string }>;
    expect(rows).toHaveLength(1);
    expect(rows[0].class_id).toBe(classId);
  });

  test('teacher can upsert updated data for their class', async ({ request }) => {
    const updated = {
      attendance: { '2026-07-01': { Alice: true } },
      payment: { '2026-07': { Alice: true } },
      grades: {},
    };
    const res = await request.post(`${SUPABASE_URL}/rest/v1/records`, {
      headers: h(token, { Prefer: 'return=representation,resolution=merge-duplicates' }),
      data: { class_id: classId, owner_id: teacherId, data: updated, updated_at: new Date().toISOString() },
    });
    // merge-duplicates on an existing row is an UPDATE under the hood → 200
    expect(res.status()).toBe(200);
    const rows = await res.json() as Array<{ data: Record<string, unknown> }>;
    expect((rows[0].data as any).payment?.['2026-07']?.Alice).toBe(true);
  });
});

// ─── Records: RLS isolation ───────────────────────────────────────────────────

test.describe('records: RLS isolation', () => {
  const emailA = uniqueEmail('rec-rls-a');
  const emailB = uniqueEmail('rec-rls-b');
  let teacherAId: string;
  let tokenA: string;
  let tokenB: string;
  let classId: string;

  test.beforeAll(async ({ request }) => {
    await createConfirmedUser({ email: emailA, password: PASSWORD, role: 'teacher' });
    await createConfirmedUser({ email: emailB, password: PASSWORD, role: 'teacher' });
    const profileA = await getProfile(emailA);
    teacherAId = profileA!.id;
    tokenA = await getAccessToken(emailA, PASSWORD);
    tokenB = await getAccessToken(emailB, PASSWORD);

    classId = uniqueClassId();
    await request.post(`${SUPABASE_URL}/rest/v1/classes`, {
      headers: h(tokenA, { Prefer: 'return=representation' }),
      data: { id: classId, name: 'RLS Record Class', owner_id: teacherAId, students: [] },
    });
    await request.post(`${SUPABASE_URL}/rest/v1/records`, {
      headers: h(tokenA, { Prefer: 'return=representation,resolution=merge-duplicates' }),
      data: { class_id: classId, owner_id: teacherAId, data: { attendance: {}, payment: {}, grades: {} }, updated_at: new Date().toISOString() },
    });
  });

  test("teacher cannot read another teacher's records (RLS filters them out)", async ({ request }) => {
    const res = await request.get(
      `${SUPABASE_URL}/rest/v1/records?class_id=eq.${classId}`,
      { headers: h(tokenB) },
    );
    expect(res.status()).toBe(200);
    // RLS: owner_id = auth.uid() → teacherA ≠ teacherB → row invisible to B
    expect((await res.json() as unknown[]).length).toBe(0);
  });
});

// ─── Cascade: deleting a class removes its record ─────────────────────────────

test.describe('classes: cascade delete removes records', () => {
  const email = uniqueEmail('cls-cascade');
  let teacherId: string;
  let token: string;
  let classId: string;

  test.beforeAll(async ({ request }) => {
    await createConfirmedUser({ email, password: PASSWORD, role: 'teacher' });
    const profile = await getProfile(email);
    teacherId = profile!.id;
    token = await getAccessToken(email, PASSWORD);

    classId = uniqueClassId();
    await request.post(`${SUPABASE_URL}/rest/v1/classes`, {
      headers: h(token, { Prefer: 'return=representation' }),
      data: { id: classId, name: 'Cascade Class', owner_id: teacherId, students: [] },
    });
    await request.post(`${SUPABASE_URL}/rest/v1/records`, {
      headers: h(token, { Prefer: 'return=representation,resolution=merge-duplicates' }),
      data: { class_id: classId, owner_id: teacherId, data: {}, updated_at: new Date().toISOString() },
    });
  });

  test('deleting a class also deletes its records', async ({ request }) => {
    const before = await request.get(
      `${SUPABASE_URL}/rest/v1/records?class_id=eq.${classId}`,
      { headers: h(token) },
    );
    expect((await before.json() as unknown[]).length).toBe(1);

    await request.delete(
      `${SUPABASE_URL}/rest/v1/classes?id=eq.${classId}`,
      { headers: h(token) },
    );

    const after = await request.get(
      `${SUPABASE_URL}/rest/v1/records?class_id=eq.${classId}`,
      { headers: h(token) },
    );
    expect((await after.json() as unknown[]).length).toBe(0);
  });
});

// ─── Superadmin: read all classes and records ─────────────────────────────────

test.describe('superadmin: read all classes and records', () => {
  const adminEmail = uniqueEmail('cls-sa-admin');
  const teacherEmail = uniqueEmail('cls-sa-teacher');
  let teacherId: string;
  let adminToken: string;
  let teacherToken: string;
  let classId: string;

  test.beforeAll(async ({ request }) => {
    await createConfirmedUser({ email: adminEmail, password: PASSWORD, role: 'teacher' });
    await createConfirmedUser({ email: teacherEmail, password: PASSWORD, role: 'teacher' });
    await getProfile(adminEmail);
    await setProfileRole(adminEmail, 'superadmin');
    const teacherProfile = await getProfile(teacherEmail);
    teacherId = teacherProfile!.id;
    adminToken = await getAccessToken(adminEmail, PASSWORD);
    teacherToken = await getAccessToken(teacherEmail, PASSWORD);

    classId = uniqueClassId();
    await request.post(`${SUPABASE_URL}/rest/v1/classes`, {
      headers: h(teacherToken, { Prefer: 'return=representation' }),
      data: { id: classId, name: 'Superadmin Target Class', owner_id: teacherId, students: [] },
    });
    await request.post(`${SUPABASE_URL}/rest/v1/records`, {
      headers: h(teacherToken, { Prefer: 'return=representation,resolution=merge-duplicates' }),
      data: { class_id: classId, owner_id: teacherId, data: { attendance: {}, payment: {}, grades: {} }, updated_at: new Date().toISOString() },
    });
  });

  test("superadmin can read any teacher's class", async ({ request }) => {
    const res = await request.get(
      `${SUPABASE_URL}/rest/v1/classes?id=eq.${classId}`,
      { headers: h(adminToken) },
    );
    expect(res.status()).toBe(200);
    const rows = await res.json() as Array<{ id: string }>;
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(classId);
  });

  test("superadmin can read any teacher's records", async ({ request }) => {
    const res = await request.get(
      `${SUPABASE_URL}/rest/v1/records?class_id=eq.${classId}`,
      { headers: h(adminToken) },
    );
    expect(res.status()).toBe(200);
    const rows = await res.json() as Array<{ class_id: string }>;
    expect(rows).toHaveLength(1);
    expect(rows[0].class_id).toBe(classId);
  });
});
