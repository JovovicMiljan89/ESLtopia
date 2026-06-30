-- Fix superadmin RLS policies on profiles.
--
-- Root cause: the original policies called get_my_role() which queries the
-- profiles table from within an RLS USING clause on the same table. PostgreSQL's
-- recursive-RLS protection prevents the inner query from resolving, so
-- get_my_role() silently returns NULL and the superadmin policies never fired.
--
-- Fix: read the role directly from auth.jwt() -> 'user_metadata' ->> 'role',
-- which is embedded in the token at login time (no DB round-trip, no recursion).
-- setProfileRole() now keeps auth.users.raw_user_meta_data in sync so that
-- newly issued tokens carry the correct claim.
--
-- Also adds the previously missing DELETE policy, with a self-protection clause
-- so a superadmin cannot delete their own profile via the API.

drop policy if exists "Superadmin can read all profiles"  on public.profiles;
drop policy if exists "Superadmin can update any profile" on public.profiles;

create policy "Superadmin can read all profiles"
  on public.profiles for select
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin');

create policy "Superadmin can update any profile"
  on public.profiles for update
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin');

create policy "Superadmin can delete any profile"
  on public.profiles for delete
  using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin'
    and id != auth.uid()
  );
