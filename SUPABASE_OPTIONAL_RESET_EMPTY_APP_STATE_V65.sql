-- اختياري فقط إذا أردت بدء النظام من حالة فارغة نظيفة في Supabase
-- لا تشغله إذا كان لديك بيانات تريد الاحتفاظ بها.

update app_settings
set setting_value = jsonb_build_object(
  'version', 1,
  'savedAt', now(),
  'storageMode', 'v65-manual-empty-reset',
  'employees', jsonb_build_array(),
  'leaves', jsonb_build_array(),
  'travelRequests', jsonb_build_array()
),
updated_at = now()
where setting_key = 'app_state';
