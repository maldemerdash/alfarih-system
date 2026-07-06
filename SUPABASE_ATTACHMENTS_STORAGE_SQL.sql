-- إعداد الحفظ الحقيقي للمرفقات في Supabase
-- شغل هذا الملف مرة واحدة من Supabase SQL Editor.
-- الهدف: إنشاء جدول فهرسة المرفقات، وتجهيز buckets وسياسات القراءة/الرفع.

create extension if not exists pgcrypto;

create or replace function public.is_app_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if to_regclass('public.app_user_profiles') is null then
    return false;
  end if;

  return exists (
    select 1
    from public.app_user_profiles
    where user_id = auth.uid()
      and role = 'admin'
      and is_active = true
  );
end;
$$;

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  related_table text,
  related_id text,
  file_name text not null default 'attachment',
  file_type text not null default 'application/octet-stream',
  file_size bigint not null default 0,
  storage_path text not null,
  file_url text,
  uploaded_by text,
  created_at timestamptz not null default now()
);

alter table public.attachments
  add column if not exists related_table text,
  add column if not exists related_id text,
  add column if not exists file_name text not null default 'attachment',
  add column if not exists file_type text not null default 'application/octet-stream',
  add column if not exists file_size bigint not null default 0,
  add column if not exists storage_path text,
  add column if not exists file_url text,
  add column if not exists uploaded_by text,
  add column if not exists created_at timestamptz not null default now();

create index if not exists attachments_related_lookup_idx
on public.attachments (related_table, related_id, created_at desc);

create index if not exists attachments_storage_path_idx
on public.attachments (storage_path);

alter table public.attachments enable row level security;

drop policy if exists attachments_select_authenticated on public.attachments;
create policy attachments_select_authenticated on public.attachments
for select to authenticated
using (true);

drop policy if exists attachments_insert_authenticated on public.attachments;
create policy attachments_insert_authenticated on public.attachments
for insert to authenticated
with check (true);

drop policy if exists attachments_update_admin on public.attachments;
create policy attachments_update_admin on public.attachments
for update to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

drop policy if exists attachments_delete_admin on public.attachments;
create policy attachments_delete_admin on public.attachments
for delete to authenticated
using (public.is_app_admin());

insert into storage.buckets (id, name, public)
values
  ('employee-attachments', 'employee-attachments', false),
  ('company-documents', 'company-documents', false)
on conflict (id) do update set public = excluded.public;

drop policy if exists employee_attachments_select_authenticated on storage.objects;
create policy employee_attachments_select_authenticated on storage.objects
for select to authenticated
using (bucket_id = 'employee-attachments');

drop policy if exists employee_attachments_insert_authenticated on storage.objects;
create policy employee_attachments_insert_authenticated on storage.objects
for insert to authenticated
with check (bucket_id = 'employee-attachments');

drop policy if exists employee_attachments_update_admin on storage.objects;
create policy employee_attachments_update_admin on storage.objects
for update to authenticated
using (bucket_id = 'employee-attachments' and public.is_app_admin())
with check (bucket_id = 'employee-attachments' and public.is_app_admin());

drop policy if exists employee_attachments_delete_admin on storage.objects;
create policy employee_attachments_delete_admin on storage.objects
for delete to authenticated
using (bucket_id = 'employee-attachments' and public.is_app_admin());

drop policy if exists company_documents_select_authenticated on storage.objects;
create policy company_documents_select_authenticated on storage.objects
for select to authenticated
using (bucket_id = 'company-documents');

drop policy if exists company_documents_insert_authenticated on storage.objects;
create policy company_documents_insert_authenticated on storage.objects
for insert to authenticated
with check (bucket_id = 'company-documents');

drop policy if exists company_documents_update_admin on storage.objects;
create policy company_documents_update_admin on storage.objects
for update to authenticated
using (bucket_id = 'company-documents' and public.is_app_admin())
with check (bucket_id = 'company-documents' and public.is_app_admin());

drop policy if exists company_documents_delete_admin on storage.objects;
create policy company_documents_delete_admin on storage.objects
for delete to authenticated
using (bucket_id = 'company-documents' and public.is_app_admin());
