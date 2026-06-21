// create-teacher
//
// A School account creates a teacher employed at that school. The teacher is
// created in "pending" status and emailed a link to set their own password;
// accepting it activates the account (see activate_my_account / the app).
//
// Auth: caller must be an authenticated, active School user.

import { corsHeaders, json, withCors } from '../_shared/cors.ts';
import { requireSchool } from '../_shared/auth.ts';

const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://esltopia.vercel.app';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const { svc, schoolId } = await requireSchool(req);

    const { email, firstName, lastName, middleName } = await req.json();
    if (!email || !firstName || !lastName) {
      return json({ error: 'email, firstName and lastName are required' }, 400);
    }

    // Creates the user AND emails an invite link to set a password.
    const { data, error } = await svc.auth.admin.inviteUserByEmail(
      String(email).toLowerCase(),
      {
        redirectTo: `${SITE_URL}/?setup=1`,
        data: {
          role: 'teacher',
          first_name: firstName,
          last_name: lastName,
          middle_name: middleName ?? '',
        },
      },
    );
    if (error) return json({ error: error.message }, 400);

    // Stamp school membership + pending status (service role bypasses the guard).
    const { error: upErr } = await svc
      .from('profiles')
      .update({
        school_id: schoolId,
        status: 'pending',
        first_name: firstName,
        last_name: lastName,
        middle_name: middleName ?? '',
      })
      .eq('id', data.user.id);
    if (upErr) return json({ error: upErr.message }, 400);

    return json({ ok: true, teacherId: data.user.id });
  } catch (e) {
    if (e instanceof Response) return await withCors(e);
    return json({ error: String(e) }, 500);
  }
});
