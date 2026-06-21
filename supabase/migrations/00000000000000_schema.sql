create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  first_name text,
  last_name text,
  middle_name text,
  email text,
  role text default 'teacher',
  created_at timestamptz default now()
);

create table public.classes (
  id text primary key,
  name text,
  owner_id uuid references auth.users(id) on delete cascade,
  students jsonb default '[]',
  created_at timestamptz default now()
);

create table public.records (
  class_id text primary key references public.classes(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete cascade,
  data jsonb default '{}',
  updated_at timestamptz default now()
);

create or replace function public.get_my_role()
returns text language sql security definer stable as $a$
  select role from public.profiles where id = auth.uid();
$a$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $b$
declare
  user_role text;
begin
  user_role := new.raw_user_meta_data->>'role';
  if user_role not in ('teacher', 'school') then
    user_role := 'teacher';
  end if;
  insert into public.profiles (id, email, first_name, last_name, middle_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'middle_name',
    user_role
  );
  return new;
end;
$b$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.records enable row level security;

create policy "Users can read own profile"
  on public.profiles for select using (id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update using (id = auth.uid());

create policy "Superadmin can update any profile"
  on public.profiles for update using (get_my_role() = 'superadmin');

create policy "Superadmin can read all profiles"
  on public.profiles for select using (get_my_role() = 'superadmin');

create policy "Users manage own classes"
  on public.classes for all using (owner_id = auth.uid() or get_my_role() = 'superadmin');

create policy "Users manage own records"
  on public.records for all using (owner_id = auth.uid() or get_my_role() = 'superadmin');
