-- تحديث آمن لحقل الصلاحيات التفصيلية
alter table app_user_profiles
add column if not exists permissions jsonb default '{}'::jsonb;

update app_user_profiles
set role = 'employee'
where role not in ('admin','employee') or role is null;

update app_user_profiles
set permissions = '{}'::jsonb
where permissions is null;
