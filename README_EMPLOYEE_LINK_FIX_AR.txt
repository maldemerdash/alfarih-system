إصلاح ربط المستخدم بملف الموظف

التغييرات:
- إضافة حقل ربط المستخدم بملف موظف في نافذة إضافة/تعديل المستخدم.
- إضافة حقل تأكيد كلمة المرور عند إنشاء مستخدم جديد.
- عرض الموظف المرتبط داخل جدول إدارة المستخدمين.
- دعم employee_id في Edge Function admin-create-user.

بعد رفع الملفات إلى GitHub:
1) شغل SUPABASE_EMPLOYEE_LINK_FIX_SQL.sql في Supabase SQL Editor.
2) حدّث دالة Edge Functions/admin-create-user بالكود الموجود في supabase/functions/admin-create-user/index.ts ثم Deploy.
