alter table app_user_profiles
add column if not exists permissions jsonb default '{}'::jsonb;

update app_user_profiles
set permissions = '{}'::jsonb
where permissions is null;

update app_user_profiles
set role = 'employee'
where role is null or role not in ('admin','employee');
