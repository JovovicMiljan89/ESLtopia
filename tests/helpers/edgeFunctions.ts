// tests/helpers/edgeFunctions.ts
//
// Shared helper for invoking Supabase Edge Functions from tests. Previously
// duplicated verbatim as invoke() in school-teachers.spec.ts and
// invokeEdgeFn() in superadmin.spec.ts.

import type { APIRequestContext } from '@playwright/test';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? '';

export async function invokeEdgeFunction(
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
