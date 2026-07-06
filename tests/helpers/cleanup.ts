// tests/helpers/cleanup.ts
//
// Admin helpers for E2E tests: create/confirm/delete Supabase users, read
// profiles, and generate recovery links. Requires the SERVICE ROLE key (admin),
// not the anon key. Add SUPABASE_SERVICE_ROLE_KEY to .env.test.local.
// Without it, cleanup is skipped (with a warning) so tests still pass.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

const TEST_EMAIL_DOMAIN = '@example.test';

let admin: SupabaseClient | null = null;
function adminClient(): SupabaseClient | null {
  if (!SERVICE_ROLE_KEY || !SUPABASE_URL) return null;
  if (!admin) {
    admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return admin;
}

/** Generate a unique test email. All test addresses use @example.test so teardown can purge them. */
export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${TEST_EMAIL_DOMAIN}`;
}

/** Poll fn() every 500 ms until it returns a non-null value or we exhaust retries. */
async function poll<T>(fn: () => Promise<T | null>, retries = 10): Promise<T | null> {
  for (let i = 0; i < retries; i++) {
    const result = await fn();
    if (result !== null) return result;
    await new Promise(r => setTimeout(r, 500));
  }
  return null;
}

/**
 * Create an already-confirmed user via the admin API so login tests have a
 * known account without going through the email-confirmation flow.
 * The `on_auth_user_created` trigger populates the matching profiles row.
 */
export async function createConfirmedUser(opts: {
  email: string;
  password: string;
  role?: 'teacher' | 'school';
  firstName?: string;
  lastName?: string;
}): Promise<void> {
  const client = adminClient();
  if (!client) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required to create test users — add it to .env.test.local',
    );
  }
  const { error } = await client.auth.admin.createUser({
    email: opts.email,
    password: opts.password,
    email_confirm: true,
    user_metadata: {
      first_name: opts.firstName ?? 'Login',
      last_name: opts.lastName ?? 'Tester',
      role: opts.role ?? 'teacher',
    },
  });
  if (error) {
    // Idempotent: under fullyParallel the file's beforeAll can run in more than
    // one worker, each trying to create the same fixture. An existing user has
    // the same (email, password) here, so treat "already registered" as success.
    const alreadyExists =
      (error as { code?: string }).code === 'email_exists' ||
      /already.*registered/i.test(error.message);
    if (alreadyExists) return;
    throw new Error(`createConfirmedUser failed: ${error.message}`);
  }
}

export interface ProfileRow {
  id: string;
  role: string | null;
  status: string | null;
  school_id: string | null;
}

/** Read a profile (role/status/school_id) by email via the service role. Polls briefly for the trigger to fire. */
export async function getProfile(email: string): Promise<ProfileRow | null> {
  const client = adminClient();
  if (!client) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to read profiles');
  return poll(async () => {
    const { data } = await client
      .from('profiles')
      .select('id, role, status, school_id')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    return (data as ProfileRow) ?? null;
  });
}

/** Mark a user's email as confirmed (simulates clicking the confirmation link). */
export async function confirmUser(email: string): Promise<void> {
  const client = adminClient();
  if (!client) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to confirm users');
  const profile = await getProfile(email);
  if (!profile) throw new Error(`confirmUser: no user found for ${email}`);
  const { error } = await client.auth.admin.updateUserById(profile.id, { email_confirm: true });
  if (error) throw new Error(`confirmUser failed: ${error.message}`);
}

/** Force a profile's status (service role bypasses the column guard). */
export async function setProfileStatus(email: string, status: string): Promise<void> {
  const client = adminClient();
  if (!client) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to set status');
  const { error } = await client
    .from('profiles')
    .update({ status })
    .eq('email', email.toLowerCase());
  if (error) throw new Error(`setProfileStatus failed: ${error.message}`);
}

/** Link a teacher to a school (service role bypasses the column guard). */
export async function setProfileSchoolId(email: string, schoolId: string): Promise<void> {
  const client = adminClient();
  if (!client) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to set school_id');
  const { error } = await client
    .from('profiles')
    .update({ school_id: schoolId })
    .eq('email', email.toLowerCase());
  if (error) throw new Error(`setProfileSchoolId failed: ${error.message}`);
}

/** Force a profile's role (service role bypasses the column guard).
 *  Also updates auth.users.raw_user_meta_data so the next JWT issued for this
 *  user carries the correct user_metadata.role claim (required for RLS policies
 *  that read from auth.jwt() rather than querying the profiles table). */
export async function setProfileRole(email: string, role: string): Promise<void> {
  const client = adminClient();
  if (!client) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to set role');

  const profile = await getProfile(email);
  if (!profile) throw new Error(`setProfileRole: no profile found for ${email}`);

  const { error: profileError } = await client
    .from('profiles')
    .update({ role })
    .eq('email', email.toLowerCase());
  if (profileError) throw new Error(`setProfileRole failed: ${profileError.message}`);

  const { error: authError } = await client.auth.admin.updateUserById(profile.id, {
    user_metadata: { role },
  });
  if (authError) throw new Error(`setProfileRole (auth sync) failed: ${authError.message}`);
}

/**
 * POST to Supabase's /auth/v1/token endpoint with an arbitrary grant query and
 * body, retrying with linear backoff on 429 (Supabase auth rate limit). Under
 * heavy parallel/cross-browser local runs, the token endpoint's real rate
 * limiter does eventually trip -- callers that hit it directly with `request`
 * instead of this helper see it as a raw, un-retried 429 (or a downstream
 * crash if they assume a token is always present). Returns the status and
 * parsed body so callers can assert on either, rather than throwing on a
 * non-2xx the way getAccessToken below does.
 */
export async function postAuthToken(
  grantQuery: string,
  body: Record<string, unknown>,
): Promise<{ status: number; body: Record<string, unknown> }> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?${grantQuery}`, {
      method: 'POST',
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.status === 429) {
      await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
      continue;
    }
    return { status: res.status, body: await res.json().catch(() => ({})) };
  }
  throw new Error('postAuthToken: rate limited after 5 attempts');
}

/** Sign in via the password grant and return the access token (for invoking edge functions). */
export async function getAccessToken(email: string, password: string): Promise<string> {
  const { status, body } = await postAuthToken('grant_type=password', { email: email.toLowerCase(), password });
  if (status !== 200) throw new Error(`getAccessToken failed: HTTP ${status}`);
  if (!body.access_token) throw new Error('getAccessToken: no access_token returned');
  return body.access_token as string;
}

/**
 * Generate a password-recovery action link via the admin API, without sending
 * or reading an email. Visiting the returned link establishes a recovery session,
 * which makes the app show the "Set a new password" screen.
 */
export async function generateRecoveryLink(email: string, redirectTo: string): Promise<string> {
  const client = adminClient();
  if (!client) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required to generate recovery links — add it to .env.test.local',
    );
  }
  const { data, error } = await client.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo },
  });
  if (error) throw new Error(`generateRecoveryLink failed: ${error.message}`);
  const link = data.properties?.action_link;
  if (!link) throw new Error('generateRecoveryLink: no action_link returned');
  return link;
}

/**
 * Delete every user whose email ends with the test domain.
 * Safe in production: real users never use the `.test` TLD.
 *
 * NOTE: purges ALL test users — if the suite grows to run multiple auth tests
 * in parallel across runs, switch to deleting only addresses from the current
 * run to avoid races.
 */
export async function deleteTestUsers(): Promise<void> {
  const client = adminClient();
  if (!client) {
    console.warn(
      '[cleanup] SUPABASE_SERVICE_ROLE_KEY not set — skipping test-user cleanup. ' +
        'Add it to .env.test.local to auto-delete created users.',
    );
    return;
  }

  let deleted = 0;
  for (let page = 1; page <= 100; page++) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      console.warn(`[cleanup] listUsers failed on page ${page}: ${error.message}`);
      break;
    }
    const users = data?.users ?? [];
    if (users.length === 0) break;

    const testUsers = users.filter(u => (u.email ?? '').toLowerCase().endsWith(TEST_EMAIL_DOMAIN));
    for (const u of testUsers) {
      const { error: delErr } = await client.auth.admin.deleteUser(u.id);
      if (delErr) {
        console.warn(`[cleanup] failed to delete ${u.email}: ${delErr.message}`);
      } else {
        deleted++;
      }
    }

    if (users.length < 1000) break;
  }

  console.log(`[cleanup] removed ${deleted} test user(s) (${TEST_EMAIL_DOMAIN})`);
}
