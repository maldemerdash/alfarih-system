# تحديث دالة admin-create-user

انسخ الكود الموجود في الملف التالي إلى Edge Function باسم `admin-create-user` داخل ملف `index.ts` ثم اضغط Deploy:

`supabase/functions/admin-create-user/index.ts`

هذه النسخة لا تكتفي بإنشاء المستخدم، بل تدير المستخدمين بالكامل من خلال دالة آمنة باستخدام service_role داخل Supabase فقط:

- list-users: جلب المستخدمين من app_user_profiles بدون تعليق RLS من المتصفح.
- create-user: إنشاء حساب الدخول في Authentication ثم إنشاء الصلاحية.
- update-user: تعديل الاسم والبريد والصلاحيات والحالة.
- toggle-user: إيقاف / تنشيط المستخدم.
- delete-user: حذف المستخدم من Authentication ومن app_user_profiles.

بعد نشر الدالة، ارفع ملفات الموقع إلى GitHub ثم جرّب صفحة إدارة المستخدمين.
