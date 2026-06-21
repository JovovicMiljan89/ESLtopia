-- School → Teachers feature
--
-- Adds school membership + account status to profiles, a scoped RLS policy so a
-- school can see its own teachers, a guard against privilege escalation via the
-- existing self-update policy, and a self-service activation function used when
-- a teacher accepts their invite and sets a password.

-- 1. Columns ----------------------------------------------------------------
alter table public.profiles
  add column if not exists school_id uuid references public.profiles(id) on delete set null,
  add column if not exists status text not null default 'active'
    check (status in ('pending', 'active', 'inactive'));

-- Existing users remain active (the default covers new rows).
update public.profiles set status = 'active' where status is null;

-- 2. RLS: a school can read the profiles of its own teachers ----------------
drop policy if exists "School reads own teachers" on public.profiles;
create policy "School reads own teachers"
  on public.profiles for select
  using (school_id = auth.uid());

-- 3. Guard privileged columns ----------------------------------------------
-- The existing "Users can update own profile" policy (id = auth.uid()) would
-- otherwise let any user change their OWN role/status/school_id — e.g. a teacher
-- self-promoting to superadmin. This trigger makes those columns immutable for
-- normal users; service-role (edge functions) and superadmins are exempt, and
-- the activation function flips status pending->active through a scoped flag.
create or replace function public.guard_profile_columns()
returns trigger language plpgsql security definer as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;
  if (select role from public.profiles where id = auth.uid()) = 'superadmin' then
    return new;
  end if;
  if coalesce(current_setting('app.activating', true), '') = 'on' then
    return new;
  end if;
  if new.role is distinct from old.role
     or new.status is distinct from old.status
     or new.school_id is distinct from old.school_id then
    raise exception 'Not allowed to modify role, status or school_id';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_columns_trg on public.profiles;
create trigger guard_profile_columns_trg
  before update on public.profiles
  for each row execute function public.guard_profile_columns();

-- 4. Self-service activation (pending -> active) ----------------------------
-- Called by an invited teacher right after they set their password.
create or replace function public.activate_my_account()
returns void language plpgsql security definer as $$
begin
  perform set_config('app.activating', 'on', true);
  update public.profiles
     set status = 'active'
   where id = auth.uid() and status = 'pending';
end;
$$;

grant execute on function public.activate_my_account() to authenticated;
