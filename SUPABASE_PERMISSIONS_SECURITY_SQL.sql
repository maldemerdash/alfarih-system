alter table app_user_profiles
add column if not exists permissions jsonb default '{}'::jsonb;

update app_user_profiles
set permissions = '{}'::jsonb
where permissions is null;
