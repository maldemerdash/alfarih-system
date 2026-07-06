-- تشغيل هذا الكود في Supabase SQL Editor قبل استخدام نسخة تسجيل الدخول
create extension if not exists "uuid-ossp";

create table if not exists app_user_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique,
  full_name text not null,
  email text unique not null,
  role text not null default 'employee' check (role in ('admin','hr','accountant','manager','employee')),
  is_active boolean not null default true,
  employee_id text,
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table app_user_profiles
add column if not exists employee_id text;

alter table app_user_profiles
add column if not exists permissions jsonb not null default '{}'::jsonb;

alter table app_user_profiles
alter column permissions set default '{}'::jsonb;

update app_user_profiles
set permissions = '{}'::jsonb
where permissions is null;

alter table app_user_profiles
alter column permissions set not null;

alter table app_user_profiles enable row level security;

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_user_profiles
    where user_id = auth.uid()
      and role = 'admin'
      and is_active = true
  );
$$;

drop policy if exists "app_user_profiles_self_read" on app_user_profiles;
create policy "app_user_profiles_self_read" on app_user_profiles
for select using (auth.uid() = user_id or email = auth.email());

drop policy if exists "app_user_profiles_admin_manage" on app_user_profiles;
create policy "app_user_profiles_admin_manage" on app_user_profiles
for all using (public.is_app_admin()) with check (public.is_app_admin());

create index if not exists app_user_profiles_user_id_idx
on public.app_user_profiles (user_id);

create index if not exists app_user_profiles_email_lower_idx
on public.app_user_profiles (lower(email));

create index if not exists app_user_profiles_employee_id_idx
on public.app_user_profiles (employee_id);
