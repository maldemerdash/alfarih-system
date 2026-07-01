-- إرجاع مسير الرواتب إلى غير معتمد بدون حذف الموظفين أو السلفيات
-- يشيل فقط payrollRuns من حالة التطبيق السحابية app_state

update public.app_settings
set
  setting_value = (setting_value::jsonb - 'payrollRuns')::jsonb,
  updated_at = now()
where setting_key = 'app_state';
