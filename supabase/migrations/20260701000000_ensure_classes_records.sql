-- Ensure the classes and records tables exist in production, and that the
-- missing profile RLS policies from 00000000000000_schema.sql are present.
--
-- The original schema migration was marked as "applied" in the migration
-- history without being run, because the profiles table already existed.
-- As a result, classes and records were never created, and the basic user-level
-- profile policies ("Users can read/update own profile") were never applied.

create table if not exists public.classes (
  id          text primary key,
  name        text,
  owner_id    uuid references auth.users(id) on delete cascade,
  students    jsonb default '[]',
  created_at  timestamptz default now()
);

create table if not exists public.records (
  class_id    text primary key references public.classes(id) on delete cascade,
  owner_id    uuid references auth.users(id) on delete cascade,
  data        jsonb default '{}',
  updated_at  timestamptz default now()
);

alter table public.classes enable row level security;
alter table public.records enable row level security;

drop policy if exists "Users manage own classes" on public.classes;
create policy "Users manage own classes"
  on public.classes for all
  using (owner_id = auth.uid() or get_my_role() = 'superadmin');

drop policy if exists "Users manage own records" on public.records;
create policy "Users manage own records"
  on public.records for all
  using (owner_id = auth.uid() or get_my_role() = 'superadmin');

-- Missing profile policies from the original (unrun) schema migration ----------

drop policy if exists "Users can read own profile"   on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can read own profile"
  on public.profiles for select using (id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update using (id = auth.uid());
