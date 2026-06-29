-- اختياري فقط إذا بقيت أرقام المالية بعد رفع ملفات GitHub والتحديث القوي
-- يحذف بيانات المالية والسلفيات من حالة التطبيق السحابية ولا يحذف الموظفين.
UPDATE public.app_settings
SET setting_value = COALESCE(setting_value, '{}'::jsonb)
  - 'financeSettings'
  - 'financeDailyOpen'
  - 'financeDailyDays'
  - 'financeDailyCurrentDate'
  - 'payrollAdvances',
  updated_at = now()
WHERE setting_key = 'app_state';
