alter table app_user_profiles
add column if not exists employee_id uuid references employees(id) on delete set null;

alter table app_user_profiles
add column if not exists permissions jsonb default '{}'::jsonb;

update app_user_profiles
set permissions = '{}'::jsonb
where permissions is null;

notify pgrst, 'reload schema';
