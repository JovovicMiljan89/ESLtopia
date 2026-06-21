// tests/helpers/cleanup.ts
//
// Deletes the throwaway users that the auth E2E test creates in Supabase.
//
// Deleting users requires the SERVICE ROLE key (admin), not the anon key.
// Supabase dashboard → Project Settings → API → "service_role" secret.
// Put it in .env.test.local as SUPABASE_SERVICE_ROLE_KEY=...
//
// Without that key the cleanup is skipped (with a warning) so the test
// suite still passes — it just won't remove the created users.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

// Test addresses always use this domain (see registration.spec.ts).
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

/**
 * Read a profile's role by email, using the service role (bypasses RLS).
 * Polls briefly because the profile is created by a trigger on user insert.
 */
export async function getProfileRole(email: string): Promise<string | null> {
  const client = adminClient();
  if (!client) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to read profiles — add it to .env.test.local');
  }
  for (let attempt = 0; attempt < 10; attempt++) {
    const { data } = await client
      .from('profiles')
      .select('role')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    if (data) return (data as { role: string | null }).role ?? null;
    await new Promise((r) => setTimeout(r, 500));
  }
  return null;
}

export interface ProfileRow {
  id: string;
  role: string | null;
  status: string | null;
  school_id: string | null;
}

/** Read a profile (role/status/school_id) by email via the service role. Polls briefly. */
export async function getProfile(email: string): Promise<ProfileRow | null> {
  const client = adminClient();
  if (!client) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to read profiles');
  for (let attempt = 0; attempt < 10; attempt++) {
    const { data } = await client
      .from('profiles')
      .select('id, role, status, school_id')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    if (data) return data as ProfileRow;
    await new Promise((r) => setTimeout(r, 500));
  }
  return null;
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

/** Sign in via the password grant and return the access token (for invoking edge functions). */
export async function getAccessToken(email: string, password: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.toLowerCase(), password }),
  });
  if (!res.ok) throw new Error(`getAccessToken failed: HTTP ${res.status}`);
  const body = await res.json();
  if (!body.access_token) throw new Error('getAccessToken: no access_token returned');
  return body.access_token as string;
}

/**
 * Generate a password-recovery action link via the admin API, without sending
 * or reading an email. Visiting the returned link in the browser establishes a
 * recovery session, which makes the app show the "Set a new password" screen.
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
 * NOTE: this purges ALL test users, so if the suite ever grows to run
 * multiple auth tests in parallel, switch to deleting only the addresses
 * created by the current run to avoid races.
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
  // Admin list is paginated; walk pages until exhausted.
  for (let page = 1; page <= 100; page++) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      console.warn(`[cleanup] listUsers failed on page ${page}: ${error.message}`);
      break;
    }
    const users = data?.users ?? [];
    if (users.length === 0) break;

    const testUsers = users.filter((u) =>
      (u.email ?? '').toLowerCase().endsWith(TEST_EMAIL_DOMAIN),
    );
    for (const u of testUsers) {
      const { error: delErr } = await client.auth.admin.deleteUser(u.id);
      if (delErr) {
        console.warn(`[cleanup] failed to delete ${u.email}: ${delErr.message}`);
      } else {
        deleted++;
      }
    }

    if (users.length < 1000) break; // last page
  }

  console.log(`[cleanup] removed ${deleted} test user(s) (${TEST_EMAIL_DOMAIN})`);
}
