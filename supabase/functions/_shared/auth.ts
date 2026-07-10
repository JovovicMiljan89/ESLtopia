// Shared Supabase helpers for the school/teacher edge functions.

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Service-role client — full admin access. Only ever runs server-side.
export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

// Verify the caller is an authenticated, active School user.
// Throws a Response (401/403) otherwise. Returns the service client + school id.
export async function requireSchool(
  req: Request,
): Promise<{ svc: SupabaseClient; schoolId: string }> {
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '').trim();
  if (!token) throw new Response(JSON.stringify({ error: 'Missing token' }), { status: 401 });

  const svc = serviceClient();
  const { data: { user }, error } = await svc.auth.getUser(token);
  if (error || !user) {
    throw new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
  }

  const { data: profile } = await svc
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'school' || profile.status !== 'active') {
    throw new Response(JSON.stringify({ error: 'Forbidden — school account required' }), {
      status: 403,
    });
  }
  return { svc, schoolId: user.id };
}

// Verify the caller is an authenticated, active user of any role (teacher,
// school, or superadmin). Throws a Response (401/403) otherwise. Returns the
// service client + user id.
export async function requireUser(
  req: Request,
): Promise<{ svc: SupabaseClient; userId: string }> {
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '').trim();
  if (!token) throw new Response(JSON.stringify({ error: 'Missing token' }), { status: 401 });

  const svc = serviceClient();
  const { data: { user }, error } = await svc.auth.getUser(token);
  if (error || !user) {
    throw new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
  }

  const { data: profile } = await svc
    .from('profiles')
    .select('status')
    .eq('id', user.id)
    .single();

  if (!profile || profile.status !== 'active') {
    throw new Response(JSON.stringify({ error: 'Forbidden — active account required' }), {
      status: 403,
    });
  }
  return { svc, userId: user.id };
}
