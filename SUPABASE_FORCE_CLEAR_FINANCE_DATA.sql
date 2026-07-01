-- تنظيف إجباري لبيانات المالية والسلفيات فقط من حالة التطبيق السحابية.
-- لا يحذف الموظفين، ولا يحذف الصلاحيات، ولا يحذف الإجازات أو الحضور.

UPDATE public.app_settings
SET setting_value = (
  WITH base AS (
    SELECT COALESCE(setting_value, '{}'::jsonb) AS v
    FROM public.app_settings
    WHERE setting_key = 'app_state'
  ), stripped AS (
    SELECT v
      - 'financeSettings'
      - 'financeDailyOpen'
      - 'financeDailyDays'
      - 'financeDailyCurrentDate'
      - 'financeSettingsUpdatedAt'
      - 'payrollAdvances' AS v
    FROM base
  ), cleaned_employees AS (
    SELECT CASE
      WHEN jsonb_typeof(v->'employees') = 'array' THEN
        jsonb_set(
          v,
          '{employees}',
          (
            SELECT jsonb_agg(employee || '{"salaryAdvance":0,"advanceDeduction":0}'::jsonb)
            FROM jsonb_array_elements(v->'employees') AS employee
          ),
          true
        )
      ELSE v
    END AS v
    FROM stripped
  )
  SELECT v FROM cleaned_employees
),
updated_at = now()
WHERE setting_key = 'app_state';
