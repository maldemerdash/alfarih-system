-- v57 performance indexes for the HR web app.
-- Run once in Supabase SQL Editor. Safe to run again because IF NOT EXISTS is used.

create unique index if not exists app_settings_setting_key_uidx
on public.app_settings (setting_key);

create index if not exists app_user_profiles_user_id_idx
on public.app_user_profiles (user_id);

create index if not exists app_user_profiles_email_lower_idx
on public.app_user_profiles (lower(email));

create index if not exists app_user_profiles_active_role_idx
on public.app_user_profiles (is_active, role);

create index if not exists attachments_related_lookup_idx
on public.attachments (related_table, related_id, created_at desc);

create index if not exists attachments_storage_path_idx
on public.attachments (storage_path);

analyze public.app_settings;
analyze public.app_user_profiles;
analyze public.attachments;
