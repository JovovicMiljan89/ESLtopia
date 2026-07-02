-- Soft-delete support for profiles.
-- Adds deleted_at so deleted accounts are retained for reporting
-- instead of being permanently removed.

alter table public.profiles
  add column if not exists deleted_at timestamptz;
