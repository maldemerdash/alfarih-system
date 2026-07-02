-- Run once in Supabase SQL editor if linking users to employees fails.

alter table public.app_user_profiles
  add column if not exists employee_id text;

create unique index if not exists app_user_profiles_email_unique
  on public.app_user_profiles (lower(email));

create index if not exists app_user_profiles_employee_id_idx
  on public.app_user_profiles (employee_id);
