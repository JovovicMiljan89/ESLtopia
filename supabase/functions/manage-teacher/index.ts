// manage-teacher
//
// A School account deactivates, reactivates, or removes one of ITS OWN teachers.
//   - deactivate: bans the auth account (blocks login) + status 'inactive'
//   - reactivate: lifts the ban + status 'active'
//   - remove:     deletes the auth account, which cascades (via `on delete
//                 cascade` foreign keys) to the teacher's profile AND to
//                 every class and record they own -- classes.owner_id and
//                 records.owner_id both cascade from auth.users. This is a
//                 permanent, unrecoverable deletion of that teacher's entire
//                 gradebook, not just their login. The caller-facing confirm
//                 dialog (EmployeesPanel.jsx) must say so explicitly.
//
// Auth: caller must be an authenticated, active School user, and the target
// teacher must belong to that school.

import { corsHeaders, json, withCors } from '../_shared/cors.ts';
import { requireSchool } from '../_shared/auth.ts';

// Effectively permanent ban (~100 years).
const BAN_DURATION = '876600h';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const { svc, schoolId } = await requireSchool(req);

    const { teacherId, action } = await req.json();
    if (!teacherId || !action) {
      return json({ error: 'teacherId and action are required' }, 400);
    }

    // Ownership check — the target must be a teacher of this school.
    const { data: target } = await svc
      .from('profiles')
      .select('id, role, school_id')
      .eq('id', teacherId)
      .single();
    if (!target || target.role !== 'teacher' || target.school_id !== schoolId) {
      return json({ error: 'Not one of your teachers' }, 403);
    }

    switch (action) {
      case 'deactivate': {
        const { error } = await svc.auth.admin.updateUserById(teacherId, {
          ban_duration: BAN_DURATION,
        });
        if (error) return json({ error: error.message }, 400);
        await svc.from('profiles').update({ status: 'inactive' }).eq('id', teacherId);
        break;
      }
      case 'reactivate': {
        const { error } = await svc.auth.admin.updateUserById(teacherId, {
          ban_duration: 'none',
        });
        if (error) return json({ error: error.message }, 400);
        await svc.from('profiles').update({ status: 'active' }).eq('id', teacherId);
        break;
      }
      case 'remove': {
        const { error } = await svc.auth.admin.deleteUser(teacherId);
        if (error) return json({ error: error.message }, 400);
        break;
      }
      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }

    return json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return await withCors(e);
    return json({ error: String(e) }, 500);
  }
});
