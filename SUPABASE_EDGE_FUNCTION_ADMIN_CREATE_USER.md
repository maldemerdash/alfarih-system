# تحديث دالة admin-create-user

انسخ كود الملف التالي إلى Edge Function باسم `admin-create-user` داخل ملف `index.ts` ثم اضغط Deploy:

`supabase/functions/admin-create-user/index.ts`

هذه النسخة تدعم:
- إنشاء مستخدم بكلمة مرور.
- ربط المستخدم بملف موظف عبر `employee_id`.
- حفظ الصلاحيات التفصيلية.
- جلب المستخدمين مع الموظف المرتبط.
- تعديل / إيقاف / حذف المستخدمين من الموقع.

بعد النشر شغل ملف SQL:

`SUPABASE_EMPLOYEE_LINK_PERMISSIONS_SQL.sql`
